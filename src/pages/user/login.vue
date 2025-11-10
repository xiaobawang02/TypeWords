<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseInput from "@/components/base/BaseInput.vue";
import BaseButton from "@/components/BaseButton.vue";
import {APP_NAME} from "@/config/env.ts";
import {useAuthStore} from "@/stores/auth.ts";
import {sendCode, register as registerApi, resetPassword, uploadImportData} from "@/apis";
import {validateLoginForm, validateRegisterForm, validateResetPasswordForm} from "@/utils/validation.ts";
import Toast from "@/components/base/toast/Toast.ts";
import { getWechatAuthUrl, PHONE_CONFIG } from "@/config/auth.ts";

// 状态管理
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// 页面状态
let currentMode = $ref<'login' | 'register' | 'forgot'>('login')
let loginType = $ref<'code' | 'password'>('code') // 默认验证码登录
let isLoading = $ref(false)
let isSendingCode = $ref(false)
let codeCountdown = $ref(0)
let showWechatQR = $ref(false)
let wechatQRUrl = $ref('')

// 表单数据
const loginForm = $ref({
  account: '', // 支持邮箱或手机号
  password: ''
})

const phoneLoginForm = $ref({
  phone: '',
  code: ''
})

const registerForm = $ref({
  phone: '',
  password: '',
  confirmPassword: '',
  code: ''
})

const forgotForm = $ref({
  phone: '',
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 错误信息
const loginErrors = ref<Record<string, string>>({})
const registerErrors = ref<Record<string, string>>({})
const forgotErrors = ref<Record<string, string>>({})

// 发送验证码
async function sendVerificationCode(phone: string, type: 'login' | 'register' | 'reset_password') {
  if (!phone) {
    Toast.error('请输入手机号')
    return
  }
  
  if (!PHONE_CONFIG.phoneRegex.test(phone)) {
    Toast.error('请输入有效的手机号')
    return
  }

  try {
    isSendingCode = true
    const response = await sendCode({ phone, type })
    
    if (response.success) {
      Toast.success('验证码已发送')
      codeCountdown = PHONE_CONFIG.sendInterval
      const timer = setInterval(() => {
        codeCountdown--
        if (codeCountdown <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      Toast.error(response.msg || '发送失败')
    }
  } catch (error) {
    console.error('Send code error:', error)
    Toast.error('发送验证码失败')
  } finally {
    isSendingCode = false
  }
}

// 账号密码登录
async function handleLogin() {
  // 判断是邮箱还是手机号
  const isEmail = loginForm.account.includes('@')
  const validation = validateLoginForm({
    email: isEmail ? loginForm.account : undefined,
    phone: !isEmail ? loginForm.account : undefined,
    password: loginForm.password,
    code: undefined,
    type: 'email'
  })

  if (!validation.isValid) {
    Object.assign(loginErrors, validation.errors)
    return
  }

  isLoading = true
  try {
    await authStore.login({
      email: isEmail ? loginForm.account : undefined,
      phone: !isEmail ? loginForm.account : undefined,
      password: loginForm.password,
      type: 'email'
    })
  } finally {
    isLoading = false
  }
}

// 手机号验证码登录
async function handlePhoneCodeLogin() {
  const validation = validateLoginForm({
    phone: phoneLoginForm.phone,
    code: phoneLoginForm.code,
    password: undefined,
    type: 'phone'
  })

  if (!validation.isValid) {
    Object.assign(loginErrors, validation.errors)
    return
  }

  isLoading = true
  try {
    await authStore.login({
      phone: phoneLoginForm.phone,
      code: phoneLoginForm.code,
      type: 'phone'
    })
  } finally {
    isLoading = false
  }
}

// 注册
async function handleRegister() {
  if (registerForm.password !== registerForm.confirmPassword) {
    Toast.error('两次密码输入不一致')
    return
  }

  const validation = validateRegisterForm({
    phone: registerForm.phone,
    password: registerForm.password,
    code: registerForm.code,
    nickname: undefined,
    email: undefined
  })

  if (!validation.isValid) {
    Object.assign(registerErrors, validation.errors)
    return
  }

  isLoading = true
  try {
    await authStore.register({
      phone: registerForm.phone,
      password: registerForm.password,
      code: registerForm.code,
      nickname: undefined,
      email: undefined
    })
  } finally {
    isLoading = false
  }
}

// 忘记密码
async function handleForgotPassword() {
  if (forgotForm.newPassword !== forgotForm.confirmPassword) {
    Toast.error('两次密码输入不一致')
    return
  }

  const validation = validateResetPasswordForm({
    phone: forgotForm.phone,
    email: forgotForm.email,
    code: forgotForm.code,
    newPassword: forgotForm.newPassword
  })

  if (!validation.isValid) {
    Object.assign(forgotErrors, validation.errors)
    return
  }

  isLoading = true
  try {
    const response = await authStore.resetPassword({
      phone: forgotForm.phone,
      email: forgotForm.email,
      code: forgotForm.code,
      newPassword: forgotForm.newPassword
    })
    
    if (response.success) {
      Toast.success('密码重置成功，请重新登录')
      switchMode('login')
    } else {
      Toast.error(response.msg || '重置失败')
    }
  } finally {
    isLoading = false
  }
}

// 微信登录 - 显示二维码
async function handleWechatLogin() {
  try {
    showWechatQR = true
    // 这里应该调用后端获取二维码
    // const response = await getWechatQR()
    // wechatQRUrl = response.qrUrl
    
    // 暂时使用占位二维码
    wechatQRUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSI+55So5o6l566h55CG6L295Lit6K+B77yBPC90ZXh0Pgo8L3N2Zz4K'
    
    // 模拟轮询检查扫码状态
    const checkInterval = setInterval(async () => {
      // 这里应该轮询后端检查扫码状态
      // const result = await checkWechatLoginStatus()
      // if (result.success) {
      //   clearInterval(checkInterval)
      //   showWechatQR = false
      //   // 登录成功处理
      // }
    }, 2000)
    
    // 5分钟后自动关闭二维码
    setTimeout(() => {
      clearInterval(checkInterval)
      showWechatQR = false
      Toast.info('二维码已过期，请重新获取')
    }, 300000)
    
  } catch (error) {
    console.error('Wechat login error:', error)
    Toast.error('微信登录失败')
  }
}

// 切换模式
function switchMode(mode: 'login' | 'register' | 'forgot') {
  currentMode = mode
  clearErrors()
}

// 清除错误
function clearErrors() {
  loginErrors.value = {}
  registerErrors.value = {}
  forgotErrors.value = {}
}

async function handleAudioChange(e) {
  let uploadFile = e.target?.files?.[0]
  if (!uploadFile) return
  let data = new FormData();
  data.append("file", uploadFile);
  let res = await uploadImportData(data, e => {
    console.log('e', e)
  })
  console.log('res', res)
  console.log(uploadFile)
  e.target.value = ''
}

async function s() {
  const taskId = await fetch('/startImport').then(r => r.json()).then(d => d.taskId);

  const timer = setInterval(async () => {
    const res = await fetch(`/getProgress/${taskId}`).then(r => r.json());
    console.log(`当前进度: ${res.progress}%`);
    if (res.progress >= 100) clearInterval(timer);
  }, 1000);
}

// 初始化页面
onMounted(() => {
  // 检查是否有重定向地址
  const redirect = route.query.redirect as string
  if (redirect) {
    // 如果有重定向地址，可以显示提示信息
    Toast.info('请先登录后再访问该页面')
  }
})
</script>

<template>
  <div class="login-container">
    <!-- 左侧登录区域 -->
    <div class="login-section">
      <h1 class="mb-0 text-align-center">{{ APP_NAME }}</h1>
      <span class="agreement-text">继续操作即表示你同意我们的 <a href="" class="color-link">用户协议</a> 并确认已了解 <a href="" class="color-link">隐私政策</a>。</span>
      
      <!-- 登录选项 -->
      <div v-if="currentMode === 'login' && !showWechatQR" class="login-options">
        <!-- Tab切换 -->
        <div class="login-tabs">
          <div 
            class="tab-item" 
            :class="{ active: loginType === 'code' }"
            @click="loginType = 'code'"
          >
            验证码登录
          </div>
          <div 
            class="tab-item" 
            :class="{ active: loginType === 'password' }"
            @click="loginType = 'password'"
          >
            密码登录
          </div>
        </div>

        <!-- 验证码登录表单 -->
        <template v-if="loginType === 'code'">
          <div class="form-group">
            <BaseInput 
              v-model="phoneLoginForm.phone" 
              type="tel" 
              size="large" 
              placeholder="请输入手机号"
              :class="{ 'has-error': loginErrors.phone }"
            />
            <div v-if="loginErrors.phone" class="error-text">{{ loginErrors.phone }}</div>
          </div>
          
          <div class="form-group flex gap-2">
            <div class="flex-1">
              <BaseInput 
                v-model="phoneLoginForm.code" 
                type="text" 
                size="large" 
                placeholder="请输入验证码"
                :class="{ 'has-error': loginErrors.code }"
              />
              <div v-if="loginErrors.code" class="error-text">{{ loginErrors.code }}</div>
            </div>
            <BaseButton 
              @click="sendVerificationCode(phoneLoginForm.phone, 'login')"
              :disabled="isSendingCode || codeCountdown > 0"
              type="info"
              size="large"
              class="send-code-btn"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s` : (isSendingCode ? '发送中' : '获取验证码') }}
            </BaseButton>
          </div>
          
          <BaseButton 
            class="w-full" 
            size="large" 
            :loading="isLoading"
            @click="handlePhoneCodeLogin"
          >
            登录
          </BaseButton>
        </template>

        <!-- 密码登录表单 -->
        <template v-else>
          <div class="form-group">
            <BaseInput 
              v-model="loginForm.account" 
              type="text" 
              size="large" 
              placeholder="请输入邮箱或手机号"
              :class="{ 'has-error': loginErrors.email || loginErrors.phone }"
            />
            <div v-if="loginErrors.email" class="error-text">{{ loginErrors.email }}</div>
            <div v-if="loginErrors.phone" class="error-text">{{ loginErrors.phone }}</div>
          </div>
          <div class="form-group">
            <BaseInput 
              v-model="loginForm.password" 
              type="password" 
              size="large" 
              placeholder="请输入密码"
              :class="{ 'has-error': loginErrors.password }"
            />
            <div v-if="loginErrors.password" class="error-text">{{ loginErrors.password }}</div>
          </div>
          
          <BaseButton 
            class="w-full" 
            size="large" 
            :loading="isLoading"
            @click="handleLogin"
          >
            登录
          </BaseButton>
        </template>

        <!-- 底部操作链接 -->
        <div class="bottom-actions">
          <div class="color-link cp" @click="currentMode = 'register'">注册账号</div>
          <div class="color-link cp" @click="currentMode = 'forgot'">忘记密码?</div>
        </div>
      </div>

      <!-- 注册模式 -->
      <template v-else-if="currentMode === 'register'" class="register-form">
        <h2 class="form-title">注册新账号</h2>
        
        <div class="form-group">
          <BaseInput 
            v-model="registerForm.phone" 
            type="tel" 
            size="large" 
            placeholder="请输入手机号"
            :class="{ 'has-error': registerErrors.phone }"
          />
          <div v-if="registerErrors.phone" class="error-text">{{ registerErrors.phone }}</div>
        </div>
        
        <div class="form-group flex gap-2">
          <div class="flex-1">
            <BaseInput 
              v-model="registerForm.code" 
              type="text" 
              size="large" 
              placeholder="请输入验证码"
              :class="{ 'has-error': registerErrors.code }"
            />
            <div v-if="registerErrors.code" class="error-text">{{ registerErrors.code }}</div>
          </div>
          <BaseButton 
            @click="sendVerificationCode(registerForm.phone, 'register')"
            :disabled="isSendingCode || codeCountdown > 0"
            type="info"
            size="large"
            class="send-code-btn"
          >
            {{ codeCountdown > 0 ? `${codeCountdown}s` : (isSendingCode ? '发送中' : '获取验证码') }}
            </BaseButton>
        </div>

        <div class="form-group">
          <BaseInput 
            v-model="registerForm.password" 
            type="password" 
            size="large" 
            placeholder="请设置密码（6-20位）"
            :class="{ 'has-error': registerErrors.password }"
          />
          <div v-if="registerErrors.password" class="error-text">{{ registerErrors.password }}</div>
        </div>
        
        <div class="form-group">
          <BaseInput 
            v-model="registerForm.confirmPassword" 
            type="password" 
            size="large" 
            placeholder="请再次输入密码"
          />
        </div>

        <div class="form-actions">
          <BaseButton 
            class="w-full" 
            size="large" 
            :loading="isLoading"
            @click="handleRegister"
          >
            注册
          </BaseButton>
          
          <div class="back-link">
            <div class="color-link cp" @click="switchMode('login')">返回登录</div>
          </div>
        </div>
      </template>

      <!-- 忘记密码模式 -->
      <template v-else-if="currentMode === 'forgot'" class="forgot-form">
        <h2 class="form-title">重置密码</h2>
        
        <div class="form-group">
          <BaseInput 
            v-model="forgotForm.phone" 
            type="tel" 
            size="large" 
            placeholder="请输入手机号"
            :class="{ 'has-error': forgotErrors.phone }"
          />
          <div v-if="forgotErrors.phone" class="error-text">{{ forgotErrors.phone }}</div>
        </div>
        
        <div class="form-group flex gap-2">
          <div class="flex-1">
            <BaseInput 
              v-model="forgotForm.code" 
              type="text" 
              size="large" 
              placeholder="请输入验证码"
              :class="{ 'has-error': forgotErrors.code }"
            />
            <div v-if="forgotErrors.code" class="error-text">{{ forgotErrors.code }}</div>
          </div>
          <BaseButton 
            @click="sendVerificationCode(forgotForm.phone, 'reset_password')"
            :disabled="isSendingCode || codeCountdown > 0"
            type="info"
            size="large"
            class="send-code-btn"
          >
              {{ codeCountdown > 0 ? `${codeCountdown}s` : (isSendingCode ? '发送中' : '获取验证码') }}
            </BaseButton>
        </div>

        <div class="form-group">
          <BaseInput 
            v-model="forgotForm.newPassword" 
            type="password" 
            size="large" 
            placeholder="请输入新密码（6-20位）"
            :class="{ 'has-error': forgotErrors.newPassword }"
          />
          <div v-if="forgotErrors.newPassword" class="error-text">{{ forgotErrors.newPassword }}</div>
        </div>
        
        <div class="form-group">
          <BaseInput 
            v-model="forgotForm.confirmPassword" 
            type="password" 
            size="large" 
            placeholder="请再次输入新密码"
          />
        </div>

        <div class="form-group">
          <BaseInput 
            v-model="forgotForm.email" 
            type="email" 
            size="large" 
            placeholder="请输入邮箱地址（选填）"
            :class="{ 'has-error': forgotErrors.email }"
          />
          <div v-if="forgotErrors.email" class="error-text">{{ forgotErrors.email }}</div>
        </div>

        <div class="form-actions">
          <BaseButton 
            class="w-full" 
            size="large" 
            :loading="isLoading"
            @click="handleForgotPassword"
          >
            重置密码
          </BaseButton>
          
          <div class="back-link">
            <div class="color-link cp" @click="switchMode('login')">返回登录</div>
          </div>
        </div>
      </template>
    </div>

    <!-- 右侧微信二维码 -->
    <div class="qr-section">
      <div class="qr-container">
        <div class="qr-header">
          <h3>微信扫码登录</h3>
          <div v-if="showWechatQR" class="close-btn" @click="showWechatQR = false">
            <IconFluentDismiss12Regular />
          </div>
        </div>
        <div class="qr-content">
          <img 
            v-if="showWechatQR" 
            :src="wechatQRUrl" 
            alt="微信登录二维码" 
            class="qr-image active" 
          />
          <img 
            v-else 
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSI+55So5o6l566h55CG6L295Lit6K+B77yBPC90ZXh0Pgo8L3N2Zz4K"
            alt="微信登录二维码"
            class="qr-image" 
          />
          <p class="qr-tip" v-if="!showWechatQR">请使用微信扫描二维码登录</p>
          <p class="qr-tip active" v-else>正在扫码，请稍候...</p>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.item {
  border-radius: 2rem;
  border: 1px solid #ccc;
  padding: 0.6rem 1rem;
  background: white;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;

  svg {
    font-size: 1.6rem;
  }

  div {
    font-size: 1rem;
    width: 100%;
    position: absolute;
    left: 0;
    text-align: center;
  }

  &:hover {
    border-color: var(--color-select-bg);
    background: #f9f9f9;
  }
}

.line-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #999;
  font-size: 0.9rem;

  .line {
    flex: 1;
    height: 1px;
    background: #cfcfcf;
    border: none;
  }
}

// 表单组样式
.form-group {
  margin-bottom: 1rem;
  position: relative;

  &.flex {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
  }
}

// Tab切换样式
.login-tabs {
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  padding: 1rem 1rem;
  text-align: center;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  color: #666;
  font-size: 0.95rem;

  &:hover {
    color: var(--color-select-bg);
  }

  &.active {
    color: var(--color-select-bg);
    border-bottom: 2px solid var(--color-select-bg);
    font-weight: 500;
  }
}

.tab-item {
  flex: 1;
  padding: 0.8rem 1rem;
  text-align: center;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  color: #666;
  font-size: 0.95rem;

  &:hover {
    color: var(--color-select-bg);
  }

  &.active {
    color: var(--color-select-bg);
    border-bottom: 3px solid var(--color-select-bg);
    font-weight: 500;
  }
}

// 验证码按钮样式
.send-code-btn {
  min-width: 100px;
  white-space: nowrap;
  flex-shrink: 0;
}

// 错误文本样式
.error-text {
  color: #f56c6c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  padding-left: 0.5rem;
  line-height: 1.2;
}

// 链接样式
.color-link {
  color: var(--color-select-bg);
  text-decoration: none;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.8;
  }
}

.cp {
  cursor: pointer;
}

// Input错误状态覆盖
:deep(.base-input2.has-error) {
  border-color: #f56c6c;
}

// 微信二维码样式
.wechat-qr-container {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .qr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #333;
    }
    
    .close-btn {
      cursor: pointer;
      color: #999;
      transition: color 0.3s;
      
      &:hover {
        color: #666;
      }
    }
  }
  
  .qr-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .qr-image {
      width: 200px;
      height: 200px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
    }
    
    .qr-tip {
      margin-top: 1rem;
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }
  }
}

// 登录容器布局 - 居中显示
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  gap: 3rem;
}

.login-section {
  flex: 1;
  max-width: 500px;
}

.qr-section {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
