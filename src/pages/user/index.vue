<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth.ts";
import { useRouter } from "vue-router";
import BaseButton from "@/components/BaseButton.vue";
import Toast from "@/components/base/toast/Toast.ts";

const authStore = useAuthStore()
const router = useRouter()

// 页面状态
const isLoading = ref(false)

// 退出登录
const handleLogout = async () => {
  await authStore.logout()
}

// 跳转到设置页面
const goToSettings = () => {
  router.push('/setting')
}

onMounted(() => {
  // 如果用户未登录，跳转到登录页
  if (!authStore.isLoggedIn) {
    router.push({path: "/login"});
    return
  }
  
  // 获取用户信息
  if (!authStore.user) {
    authStore.fetchUserInfo()
  }
})
</script>

<template>
  <div class="user-center">
    <div class="user-header">
      <div class="avatar">
        <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="头像" />
        <div v-else class="avatar-placeholder">
          {{ authStore.user?.nickname?.charAt(0) || 'U' }}
        </div>
      </div>
      <div class="user-info">
        <h2>{{ authStore.user?.nickname || '用户' }}</h2>
        <p v-if="authStore.user?.email">{{ authStore.user.email }}</p>
        <p v-if="authStore.user?.phone">{{ authStore.user.phone }}</p>
      </div>
    </div>

    <div class="user-actions">
      <BaseButton @click="goToSettings" class="w-full mb-4" size="large">
        系统设置
      </BaseButton>
      
      <BaseButton 
        @click="handleLogout" 
        type="info" 
        class="w-full" 
        size="large"
        :loading="isLoading"
      >
        退出登录
      </BaseButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-center {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 2rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--color-select-bg);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
}

.user-info {
  flex: 1;
  
  h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
  }
  
  p {
    margin: 0.25rem 0;
    color: #666;
    font-size: 0.9rem;
  }
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  .mb-4 {
    margin-bottom: 1rem;
  }
}
</style>
