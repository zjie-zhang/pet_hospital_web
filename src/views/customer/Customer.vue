<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

interface Customer {
  id?: number
  name: string
  phone: string
  phoneBackup?: string
  address?: string
  remark?: string
  status?: number
  petCount?: number
}

const loading = ref(false)
const tableData = ref<Customer[]>([])
const total = ref(0)
const queryParams = reactive({ keyword: '', current: 1, size: 10 })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = ref<Customer>({ name: '', phone: '' })

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

async function fetchList() {
  loading.value = true
  try {
    const res = await request.get('/v1/customers', { params: queryParams })
    tableData.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.current = 1
  fetchList()
}

function handleAdd() {
  form.value = { name: '', phone: '' }
  dialogTitle.value = '新增客户'
  dialogVisible.value = true
}

function handleEdit(row: Customer) {
  form.value = { ...row }
  dialogTitle.value = '编辑客户'
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  if (form.value.id) {
    await request.put(`/v1/customers/${form.value.id}`, form.value)
  } else {
    await request.post('/v1/customers', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  fetchList()
}

async function handleToggleStatus(row: Customer) {
  const action = row.status === 1 ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定要${action}客户「${row.name}」吗？`, '提示', { type: 'warning' })
  await request.put(`/v1/customers/${row.id}`, { ...row, status: row.status === 1 ? 0 : 1 })
  ElMessage.success(`${action}成功`)
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

onMounted(() => fetchList())
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="search-bar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索姓名/手机号"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增客户
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="petCount" label="宠物数" width="80" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.status === 1 ? 'danger' : 'success'"
              link
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="备用电话">
          <el-input v-model="form.phoneBackup" placeholder="请输入备用电话" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
