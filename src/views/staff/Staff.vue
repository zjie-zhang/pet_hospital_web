<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

interface Staff {
  id?: number
  username?: string
  password?: string
  name: string
  jobNo?: string
  phone?: string
  storeId?: number
  storeName?: string
  roleIds?: number[]
  roleNames?: string[]
  title?: string
  specialty?: string
  status?: number
}

interface StoreOption {
  id: number
  name: string
}

interface RoleOption {
  id: number
  roleName: string
}

const loading = ref(false)
const tableData = ref<Staff[]>([])
const total = ref(0)
const queryParams = reactive({ keyword: '', current: 1, size: 10 })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = ref<Staff>({ name: '' })
const isAdd = ref(true)

const storeOptions = ref<StoreOption[]>([])
const roleOptions = ref<RoleOption[]>([])

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  storeId: [{ required: true, message: '请选择所属门店', trigger: 'change' }],
}

async function fetchList() {
  loading.value = true
  try {
    const res = await request.get('/v1/staff', { params: queryParams })
    tableData.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function fetchOptions() {
  const [storeRes, roleRes] = await Promise.all([
    request.get('/v1/stores', { params: { size: 200 } }),
    request.get('/v1/roles'),
  ])
  storeOptions.value = storeRes.data.records ?? storeRes.data
  roleOptions.value = roleRes.data
}

function handleSearch() {
  queryParams.current = 1
  fetchList()
}

function handleAdd() {
  isAdd.value = true
  form.value = { name: '', username: '', password: '', roleIds: [] }
  dialogTitle.value = '新增员工'
  dialogVisible.value = true
}

function handleEdit(row: Staff) {
  isAdd.value = false
  form.value = { ...row, password: undefined }
  dialogTitle.value = '编辑员工'
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  if (form.value.id) {
    await request.put(`/v1/staff/${form.value.id}`, form.value)
  } else {
    await request.post('/v1/staff', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  fetchList()
}

async function handleResetPassword(row: Staff) {
  await ElMessageBox.confirm(`确定要重置「${row.name}」的密码吗？`, '提示', { type: 'warning' })
  await request.post(`/v1/staff/${row.id}/reset-password`)
  ElMessage.success('密码已重置')
}

async function handleToggleStatus(row: Staff) {
  const action = row.status === 1 ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定要${action}「${row.name}」吗？`, '提示', { type: 'warning' })
  await request.put(`/v1/staff/${row.id}`, { ...row, status: row.status === 1 ? 0 : 1 })
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

onMounted(() => {
  fetchList()
  fetchOptions()
})
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="search-bar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索姓名/工号/手机号"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增员工
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="name" label="姓名" min-width="90" />
        <el-table-column prop="jobNo" label="工号" width="100" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="storeName" label="所属门店" min-width="120" />
        <el-table-column label="角色" min-width="140">
          <template #default="{ row }">
            <el-tag
              v-for="r in (row.roleNames || [])"
              :key="r"
              size="small"
              style="margin-right: 4px"
            >{{ r }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleResetPassword(row)">重置密码</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="!isAdd" />
        </el-form-item>
        <el-form-item v-if="isAdd" label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入初始密码" show-password />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工号">
              <el-input v-model="form.jobNo" placeholder="请输入工号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属门店" prop="storeId">
              <el-select v-model="form.storeId" placeholder="请选择门店" style="width: 100%">
                <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="职称">
              <el-input v-model="form.title" placeholder="请输入职称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="擅长">
              <el-input v-model="form.specialty" placeholder="请输入擅长领域" />
            </el-form-item>
          </el-col>
        </el-row>
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
