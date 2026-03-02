import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'
import router from '../router'

interface MenuItem {
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
  children?: MenuItem[]
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const staffId = ref(0)
  const staffName = ref('')
  const companyId = ref(0)
  const storeId = ref(0)
  const endpoint = ref(localStorage.getItem('endpoint') || 'STORE')
  const roleKeys = ref<string[]>([])
  const menus = ref<MenuItem[]>([])

  async function login(username: string, password: string, ep: string) {
    const res = await request.post('/v1/auth/login', { username, password, endpoint: ep })
    const d = res.data
    token.value = d.token
    staffId.value = d.staffId
    staffName.value = d.staffName
    companyId.value = d.companyId
    storeId.value = d.storeId
    endpoint.value = d.endpoint || ep
    roleKeys.value = d.roleKeys || []
    localStorage.setItem('token', d.token)
    localStorage.setItem('endpoint', endpoint.value)
    await fetchMenus()
  }

  async function logout() {
    try {
      await request.post('/v1/auth/logout')
    } finally {
      token.value = ''
      staffId.value = 0
      staffName.value = ''
      companyId.value = 0
      storeId.value = 0
      endpoint.value = 'STORE'
      roleKeys.value = []
      menus.value = []
      localStorage.removeItem('token')
      localStorage.removeItem('endpoint')
      router.push('/login')
    }
  }

  async function fetchMenus() {
    const res = await request.get('/v1/auth/menus')
    menus.value = res.data || []
  }

  async function switchEndpoint(ep: string) {
    await request.post('/v1/auth/switch-endpoint', { endpoint: ep })
    endpoint.value = ep
    localStorage.setItem('endpoint', ep)
    await fetchMenus()
  }

  return {
    token, staffId, staffName, companyId, storeId, endpoint, roleKeys, menus,
    login, logout, fetchMenus, switchEndpoint,
  }
})
