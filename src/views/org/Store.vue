<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

interface StoreItem {
  id?: number
  name: string
  phone?: string
  province?: string
  city?: string
  district?: string
  address?: string
  businessHours?: string
  sortOrder?: number
  status?: number
}

const loading = ref(false)
const tableData = ref<StoreItem[]>([])
const total = ref(0)
const queryParams = reactive({ keyword: '', current: 1, size: 10 })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = ref<StoreItem>({ name: '' })

const rules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
}

async function fetchList() {
  loading.value = true
  try {
    const res = await request.get('/v1/stores', { params: queryParams })
    tableData.value = res.data.records ?? res.data
    total.value = res.data.total ?? 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.current = 1
  fetchList()
}

function handleAdd() {
  form.value = { name: '' }
  dialogTitle.value = '新增门店'
  dialogVisible.value = true
}

function handleEdit(row: StoreItem) {
  form.value = { ...row }
  dialogTitle.value = '编辑门店'
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  if (form.value.id) {
    await request.put(`/v1/stores/${form.value.id}`, form.value)
  } else {
    await request.post('/v1/stores', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
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
          placeholder="搜索门店名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增门店
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="phone" label="电话" min-width="120" />
        <el-table-column prop="city" label="城市" width="100" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="businessHours" label="营业时间" min-width="140" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入门店名称" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="省">
              <el-input v-model="form.province" placeholder="省" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="市">
              <el-input v-model="form.city" placeholder="市" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区">
              <el-input v-model="form.district" placeholder="区" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址">
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="营业时间">
          <el-input v-model="form.businessHours" placeholder="例: 09:00-21:00" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
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
