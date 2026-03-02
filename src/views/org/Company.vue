<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

interface Company {
  id?: number
  name?: string
  shortName?: string
  contactName?: string
  contactPhone?: string
  address?: string
  logo?: string
  status?: number
}

const loading = ref(false)
const company = ref<Company>({})
const dialogVisible = ref(false)
const formRef = ref()
const form = ref<Company>({})

const rules = {
  name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
}

async function fetchCompany() {
  loading.value = true
  try {
    const res = await request.get('/v1/company')
    company.value = res.data || {}
  } finally {
    loading.value = false
  }
}

function handleEdit() {
  form.value = { ...company.value }
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  await request.put('/v1/company', form.value)
  ElMessage.success('保存成功')
  dialogVisible.value = false
  fetchCompany()
}

onMounted(() => fetchCompany())
</script>

<template>
  <div class="page-container">
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>公司信息</span>
          <el-button type="primary" @click="handleEdit">
            <el-icon><Edit /></el-icon>编辑
          </el-button>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="公司名称">{{ company.name }}</el-descriptions-item>
        <el-descriptions-item label="简称">{{ company.shortName }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ company.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ company.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ company.address }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="company.status === 1 ? 'success' : 'danger'" size="small">
            {{ company.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑公司信息" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="公司名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入公司名称" />
        </el-form-item>
        <el-form-item label="简称">
          <el-input v-model="form.shortName" placeholder="请输入简称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactName" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
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
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
