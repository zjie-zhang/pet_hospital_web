<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

interface Role {
  id?: number
  roleKey: string
  roleName: string
  dataScope?: number
  sortOrder?: number
  status?: number
  remark?: string
  menuIds?: number[]
}

interface MenuTreeNode {
  id: number
  parentId: number
  menuName: string
  children?: MenuTreeNode[]
}

const loading = ref(false)
const tableData = ref<Role[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const treeRef = ref()
const form = ref<Role>({ roleKey: '', roleName: '' })

const menuTree = ref<MenuTreeNode[]>([])

const rules = {
  roleKey: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

const dataScopeOptions = [
  { label: '全部数据', value: 1 },
  { label: '本公司数据', value: 2 },
  { label: '本门店数据', value: 3 },
  { label: '仅本人数据', value: 4 },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await request.get('/v1/roles')
    tableData.value = res.data
  } finally {
    loading.value = false
  }
}

async function fetchMenuTree() {
  const res = await request.get('/v1/roles/menu-tree')
  menuTree.value = res.data
}

function handleAdd() {
  form.value = { roleKey: '', roleName: '', dataScope: 3, sortOrder: 0, status: 1, menuIds: [] }
  dialogTitle.value = '新增角色'
  dialogVisible.value = true
  nextTick(() => {
    treeRef.value?.setCheckedKeys([])
  })
}

async function handleEdit(row: Role) {
  const res = await request.get(`/v1/roles/${row.id}`)
  const detail: Role = res.data
  form.value = { ...detail }
  dialogTitle.value = '编辑角色'
  dialogVisible.value = true
  nextTick(() => {
    treeRef.value?.setCheckedKeys(detail.menuIds || [])
  })
}

async function handleSubmit() {
  await formRef.value?.validate()
  const checkedKeys: number[] = treeRef.value?.getCheckedKeys() || []
  const halfCheckedKeys: number[] = treeRef.value?.getHalfCheckedKeys() || []
  form.value.menuIds = [...checkedKeys, ...halfCheckedKeys]

  if (form.value.id) {
    await request.put(`/v1/roles/${form.value.id}`, form.value)
  } else {
    await request.post('/v1/roles', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  fetchList()
}

async function handleDelete(row: Role) {
  await ElMessageBox.confirm(`确定要删除角色「${row.roleName}」吗？`, '提示', { type: 'warning' })
  await request.delete(`/v1/roles/${row.id}`)
  ElMessage.success('删除成功')
  fetchList()
}

function dataScopeLabel(val?: number) {
  return dataScopeOptions.find(o => o.value === val)?.label || '-'
}

onMounted(() => {
  fetchList()
  fetchMenuTree()
})
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="search-bar">
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增角色
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="roleKey" label="角色标识" min-width="120" />
        <el-table-column prop="roleName" label="角色名称" min-width="120" />
        <el-table-column label="数据范围" min-width="120">
          <template #default="{ row }">{{ dataScopeLabel(row.dataScope) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
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
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="角色标识" prop="roleKey">
              <el-input v-model="form.roleKey" placeholder="如 admin" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="form.roleName" placeholder="如 管理员" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="数据范围">
              <el-select v-model="form.dataScope" style="width: 100%">
                <el-option
                  v-for="o in dataScopeOptions"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <div class="tree-wrapper">
            <el-tree
              ref="treeRef"
              :data="menuTree"
              :props="{ label: 'menuName', children: 'children' }"
              node-key="id"
              show-checkbox
              default-expand-all
              check-strictly
            />
          </div>
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
.tree-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
  width: 100%;
}
</style>
