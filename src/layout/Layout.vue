<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const endpointLabel = computed(() => {
  const map: Record<string, string> = { STORE: '门店端', COMPANY: '公司端' }
  return map[userStore.endpoint] || '门店端'
})

const handleEndpointSwitch = async (ep: string | number | object) => {
  await userStore.switchEndpoint(ep as string)
  router.push('/dashboard')
}

const handleLogout = () => {
  userStore.logout()
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <span>宠物医院管理系统</span>
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
          :unique-opened="true"
        >
          <template v-for="menu in userStore.menus" :key="menu.id">
            <el-sub-menu v-if="menu.children && menu.children.length" :index="String(menu.id)">
              <template #title>
                <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
                <span>{{ menu.menuName }}</span>
              </template>
              <el-menu-item
                v-for="child in menu.children"
                :key="child.id"
                :index="child.path"
              >
                <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
                <span>{{ child.menuName }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="menu.path">
              <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
              <span>{{ menu.menuName }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left" />
        <div class="header-right">
          <el-dropdown @command="handleEndpointSwitch" trigger="click">
            <span class="endpoint-switcher">
              {{ endpointLabel }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="STORE">门店端</el-dropdown-item>
                <el-dropdown-item command="COMPANY">公司端</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <span class="username">{{ userStore.staffName }}</span>

          <el-button type="danger" text size="small" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow: hidden;

  .logo {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  :deep(.el-menu) {
    border-right: none;
  }
}

.header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .endpoint-switcher {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 14px;
    color: #606266;

    &:hover {
      color: #409eff;
    }
  }

  .username {
    font-size: 14px;
    color: #303133;
  }
}

.main-content {
  background-color: #f0f2f5;
}
</style>
