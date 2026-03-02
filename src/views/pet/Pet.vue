<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

interface Pet {
  id?: number
  customerId?: number
  customerName?: string
  name: string
  species: string
  breed?: string
  gender?: string
  birthDate?: string
  weight?: number
  color?: string
  neutered?: number
  status?: number
}

interface CustomerOption {
  id: number
  name: string
  phone: string
}

const loading = ref(false)
const tableData = ref<Pet[]>([])
const total = ref(0)
const queryParams = reactive({ keyword: '', current: 1, size: 10 })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = ref<Pet>({ name: '', species: 'DOG' })

const customerOptions = ref<CustomerOption[]>([])
const customerLoading = ref(false)

const rules = {
  name: [{ required: true, message: '请输入宠物名称', trigger: 'blur' }],
  species: [{ required: true, message: '请选择物种', trigger: 'change' }],
  customerId: [{ required: true, message: '请选择主人', trigger: 'change' }],
}

async function fetchList() {
  loading.value = true
  try {
    const res = await request.get('/v1/pets', { params: queryParams })
    tableData.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function searchCustomer(keyword: string) {
  if (!keyword) return
  customerLoading.value = true
  try {
    const res = await request.get('/v1/customers', { params: { keyword, size: 20 } })
    customerOptions.value = res.data.records
  } finally {
    customerLoading.value = false
  }
}

function handleSearch() {
  queryParams.current = 1
  fetchList()
}

function handleAdd() {
  form.value = { name: '', species: 'DOG' }
  customerOptions.value = []
  dialogTitle.value = '新增宠物'
  dialogVisible.value = true
}

function handleEdit(row: Pet) {
  form.value = { ...row }
  if (row.customerId && row.customerName) {
    customerOptions.value = [{ id: row.customerId, name: row.customerName, phone: '' }]
  }
  dialogTitle.value = '编辑宠物'
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  if (form.value.id) {
    await request.put(`/v1/pets/${form.value.id}`, form.value)
  } else {
    await request.post('/v1/pets', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  fetchList()
}

async function handleDelete(row: Pet) {
  await ElMessageBox.confirm(`确定要删除宠物「${row.name}」吗？`, '提示', { type: 'warning' })
  await request.delete(`/v1/pets/${row.id}`)
  ElMessage.success('删除成功')
  fetchList()
}

function handlePageChange(page: number) {
  queryParams.current = page
  fetchList()
}

function handleSizeChange(size: number) {
  queryParams.size = size
  queryParams.current = 1
  fetchList()
}

function genderLabel(g?: string) {
  return g === 'MALE' ? '公' : g === 'FEMALE' ? '母' : '-'
}

onMounted(() => fetchList())
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="search-bar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索宠物名称/主人"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增宠物
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="100" />
        <el-table-column label="物种" width="80" align="center">
          <template #default="{ row }">
            {{ row.species === 'CAT' ? '猫' : row.species === 'DOG' ? '狗' : '其他' }}
          </template>
        </el-table-column>
        <el-table-column prop="breed" label="品种" min-width="100" />
        <el-table-column label="性别" width="60" align="center">
          <template #default="{ row }">{{ genderLabel(row.gender) }}</template>
        </el-table-column>
        <el-table-column prop="customerName" label="主人" min-width="100" />
        <el-table-column label="体重(kg)" width="90" align="center">
          <template #default="{ row }">{{ row.weight ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="绝育" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.neutered === 1 ? 'success' : 'info'" size="small">
              {{ row.neutered === 1 ? '已绝育' : '未绝育' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="主人" prop="customerId">
          <el-select
            v-model="form.customerId"
            filterable
            remote
            reserve-keyword
            placeholder="输入姓名/手机号搜索"
            :remote-method="searchCustomer"
            :loading="customerLoading"
            style="width: 100%"
          >
            <el-option
              v-for="c in customerOptions"
              :key="c.id"
              :label="`${c.name}${c.phone ? ' (' + c.phone + ')' : ''}`"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入宠物名称" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="物种" prop="species">
              <el-select v-model="form.species" style="width: 100%">
                <el-option label="狗" value="DOG" />
                <el-option label="猫" value="CAT" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品种">
              <el-input v-model="form.breed" placeholder="请输入品种" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="form.gender" placeholder="请选择" clearable style="width: 100%">
                <el-option label="公" value="MALE" />
                <el-option label="母" value="FEMALE" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker
                v-model="form.birthDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="体重(kg)">
              <el-input-number v-model="form.weight" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="毛色">
              <el-input v-model="form.color" placeholder="请输入毛色" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="绝育">
          <el-radio-group v-model="form.neutered">
            <el-radio :value="0">未绝育</el-radio>
            <el-radio :value="1">已绝育</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  padding: 4px;
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
