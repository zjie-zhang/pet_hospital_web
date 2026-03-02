<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import request from '../../utils/request'

interface MenuNode {
  id: number
  parentId: number
  menuName: string
  menuType: string
  path: string
  component: string
  perms: string
  icon: string
  visible: number
  sortOrder: number
  endpoint: string
  children?: MenuNode[]
}

const treeData = ref<MenuNode[]>([])
const flatMenus = ref<MenuNode[]>([])
const currentEndpoint = ref('COMPANY')
const selectedId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const isEdit = ref(false)

const defaultForm = (): MenuNode => ({
  id: 0,
  parentId: 0,
  menuName: '',
  menuType: 'C',
  path: '',
  component: '',
  perms: '',
  icon: '',
  visible: 1,
  sortOrder: 0,
  endpoint: currentEndpoint.value,
})

const form = reactive<MenuNode>(defaultForm())

const rules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  sortOrder: [{ required: true, message: '请输入显示排序', trigger: 'blur' }],
}

const loadTree = async () => {
  const res = await request.get('/v1/menus/tree', { params: { endpoint: currentEndpoint.value } })
  treeData.value = res.data || []
}

const loadFlatMenus = async () => {
  const res = await request.get('/v1/menus/list', { params: { endpoint: currentEndpoint.value } })
  flatMenus.value = [{ id: 0, parentId: 0, menuName: '根目录', menuType: 'M', path: '', component: '', perms: '', icon: '', visible: 1, sortOrder: 0, endpoint: '' }, ...(res.data || [])]
}

const resetForm = () => {
  Object.assign(form, defaultForm())
  isEdit.value = false
  selectedId.value = null
  formRef.value?.clearValidate()
}

const handleNodeClick = async (data: MenuNode) => {
  selectedId.value = data.id
  isEdit.value = true
  const res = await request.get(`/v1/menus/${data.id}`)
  const d = res.data
  Object.assign(form, {
    id: d.id,
    parentId: d.parentId || 0,
    menuName: d.menuName || '',
    menuType: d.menuType || 'C',
    path: d.path || '',
    component: d.component || '',
    perms: d.perms || '',
    icon: d.icon || '',
    visible: d.visible ?? 1,
    sortOrder: d.sortOrder ?? 0,
    endpoint: d.endpoint || currentEndpoint.value,
  })
}

const handleAdd = () => {
  resetForm()
  form.endpoint = currentEndpoint.value
}

const handleAddChild = () => {
  if (!selectedId.value) {
    ElMessage.warning('请先选择一个父菜单')
    return
  }
  const parentId = selectedId.value
  resetForm()
  form.parentId = parentId
  form.endpoint = currentEndpoint.value
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (isEdit.value) {
    await request.put(`/v1/menus/${form.id}`, form)
    ElMessage.success('修改成功')
  } else {
    await request.post('/v1/menus', form)
    ElMessage.success('新增成功')
  }
  await loadTree()
  await loadFlatMenus()
  if (!isEdit.value) resetForm()
}

const handleDelete = async () => {
  if (!selectedId.value) return
  await ElMessageBox.confirm('确定删除该菜单吗？', '提示', { type: 'warning' })
  await request.delete(`/v1/menus/${selectedId.value}`)
  ElMessage.success('删除成功')
  await loadTree()
  await loadFlatMenus()
  resetForm()
}

watch(currentEndpoint, async () => {
  resetForm()
  await loadTree()
  await loadFlatMenus()
})

const init = async () => {
  await loadTree()
  await loadFlatMenus()
}
init()

const parentMenuName = (pid: number) => {
  const found = flatMenus.value.find(m => m.id === pid)
  return found ? found.menuName : '根目录'
}
</script>

<template>
  <div class="menu-container">
    <!-- 左侧树 -->
    <div class="menu-tree">
      <div class="tree-header">
        <span class="tree-title">菜单分类</span>
        <div class="tree-actions">
          <el-button type="primary" link size="small" @click="handleAdd">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button type="primary" link size="small" @click="handleAddChild">
            <el-icon><FolderAdd /></el-icon>
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete" :disabled="!selectedId">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="tree-filter">
        <el-radio-group v-model="currentEndpoint" size="small">
          <el-radio-button value="COMPANY">公司端</el-radio-button>
          <el-radio-button value="STORE">门店端</el-radio-button>
        </el-radio-group>
      </div>

      <el-scrollbar style="flex: 1;">
        <el-tree
          :data="treeData"
          node-key="id"
          :props="{ label: 'menuName', children: 'children' }"
          :highlight-current="true"
          :expand-on-click-node="false"
          :default-expand-all="true"
          @node-click="handleNodeClick"
        >
          <template #default="{ data }">
            <span class="tree-node">
              <el-tag v-if="data.menuType === 'M'" type="warning" size="small" effect="plain" style="margin-right: 6px;">目录</el-tag>
              <el-tag v-else-if="data.menuType === 'C'" type="success" size="small" effect="plain" style="margin-right: 6px;">菜单</el-tag>
              <el-tag v-else type="info" size="small" effect="plain" style="margin-right: 6px;">按钮</el-tag>
              <span>{{ data.menuName }}</span>
            </span>
          </template>
        </el-tree>
      </el-scrollbar>
    </div>

    <!-- 右侧表单 -->
    <div class="menu-form">
      <h3 class="form-title">| 菜单信息</h3>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 700px;">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜单归属">
              <el-select v-model="form.parentId" placeholder="请选择父菜单" style="width: 100%;">
                <el-option
                  v-for="m in flatMenus"
                  :key="m.id"
                  :label="m.menuName"
                  :value="m.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio value="M">目录</el-radio>
                <el-radio value="C">菜单</el-radio>
                <el-radio value="F">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="form.menuType === 'M'">
          <el-col :span="12">
            <el-form-item label="菜单图标">
              <el-input v-model="form.icon" placeholder="如：House, User, Setting" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="form.menuType !== 'F'">
          <el-col :span="12">
            <el-form-item label="路由路径">
              <el-input v-model="form.path" placeholder="如：/dashboard" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组件路径" v-if="form.menuType === 'C'">
              <el-input v-model="form.component" placeholder="如：dashboard/index" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="form.menuType === 'C'">
          <el-col :span="12">
            <el-form-item label="菜单图标">
              <el-input v-model="form.icon" placeholder="如：House, User, Setting" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权限字符">
              <el-input v-model="form.perms" placeholder="如：system:menu:list" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item label="显示状态">
              <el-radio-group v-model="form.visible">
                <el-radio :value="1">显示</el-radio>
                <el-radio :value="0">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属端">
              <el-select v-model="form.endpoint" style="width: 100%;">
                <el-option label="公司端" value="COMPANY" />
                <el-option label="门店端" value="STORE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '新增菜单' }}
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.menu-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 130px);
}

.menu-tree {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;

  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .tree-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .tree-actions {
      display: flex;
      gap: 2px;
    }
  }

  .tree-filter {
    margin-bottom: 10px;
  }

  .tree-node {
    display: flex;
    align-items: center;
    font-size: 13px;
  }
}

.menu-form {
  flex: 1;
  background: #fff;
  border-radius: 6px;
  padding: 20px 24px;
  overflow-y: auto;

  .form-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 24px;
    padding-left: 2px;
  }
}
</style>
