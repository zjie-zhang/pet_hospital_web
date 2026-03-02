import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('../layout/Layout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'Dashboard', component: () => import('../views/dashboard/Dashboard.vue'), meta: { title: '首页' } },
        { path: 'org/company', name: 'Company', component: () => import('../views/org/Company.vue'), meta: { title: '公司信息' } },
        { path: 'org/store', name: 'Store', component: () => import('../views/org/Store.vue'), meta: { title: '门店管理' } },
        { path: 'staff', name: 'Staff', component: () => import('../views/staff/Staff.vue'), meta: { title: '员工管理' } },
        { path: 'role', name: 'Role', component: () => import('../views/system/Role.vue'), meta: { title: '角色管理' } },
        { path: 'system/menu', name: 'Menu', component: () => import('../views/system/Menu.vue'), meta: { title: '菜单管理' } },
        { path: 'customer', name: 'Customer', component: () => import('../views/customer/Customer.vue'), meta: { title: '客户管理' } },
        { path: 'pet', name: 'Pet', component: () => import('../views/pet/Pet.vue'), meta: { title: '宠物管理' } },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  NProgress.start()
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth === false) {
    next()
  } else if (!token) {
    next('/login')
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
