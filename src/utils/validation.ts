// 邮箱验证
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
// 手机号验证（中国大陆）
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 密码验证
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: '密码不能为空' }
  }
  if (password.length < 6) {
    return { isValid: false, message: '密码长度不能少于6位' }
  }
  if (password.length > 20) {
    return { isValid: false, message: '密码长度不能超过20位' }
  }
  return { isValid: true }
}

// 验证码验证
export const validateCode = (code: string): boolean => {
  return /^\d{6}$/.test(code)
}

// 用户名验证
export const validateNickname = (nickname: string): { isValid: boolean; message?: string } => {
  if (!nickname) {
    return { isValid: true } // 昵称可以为空
  }
  if (nickname.length < 2) {
    return { isValid: false, message: '昵称长度不能少于2位' }
  }
  if (nickname.length > 20) {
    return { isValid: false, message: '昵称长度不能超过20位' }
  }
  return { isValid: true }
}

// 综合验证函数
export const validateLoginForm = (data: {
  email?: string
  phone?: string
  password: string
  code?: string
  type: 'email' | 'phone' | 'wechat'
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (data.type === 'email') {
    if (!data.email) {
      errors.email = '邮箱不能为空'
    } else if (!validateEmail(data.email)) {
      errors.email = '请输入有效的邮箱地址'
    }
  }

  if (data.type === 'phone') {
    if (!data.phone) {
      errors.phone = '手机号不能为空'
    } else if (!validatePhone(data.phone)) {
      errors.phone = '请输入有效的手机号'
    }

    if (!data.code) {
      errors.code = '验证码不能为空'
    } else if (!validateCode(data.code)) {
      errors.code = '请输入6位数字验证码'
    }
  }

  if (data.type !== 'phone' && !data.password) {
    errors.password = '密码不能为空'
  } else if (data.type !== 'phone' && data.password) {
    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateRegisterForm = (data: {
  email?: string
  phone: string
  password: string
  code: string
  nickname?: string
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!data.phone) {
    errors.phone = '手机号不能为空'
  } else if (!validatePhone(data.phone)) {
    errors.phone = '请输入有效的手机号'
  }

  if (!data.code) {
    errors.code = '验证码不能为空'
  } else if (!validateCode(data.code)) {
    errors.code = '请输入6位数字验证码'
  }

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message
  }

  const nicknameValidation = validateNickname(data.nickname || '')
  if (!nicknameValidation.isValid) {
    errors.nickname = nicknameValidation.message
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = '请输入有效的邮箱地址'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateResetPasswordForm = (data: {
  email?: string
  phone: string
  code: string
  newPassword: string
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!data.phone) {
    errors.phone = '手机号不能为空'
  } else if (!validatePhone(data.phone)) {
    errors.phone = '请输入有效的手机号'
  }

  if (!data.code) {
    errors.code = '验证码不能为空'
  } else if (!validateCode(data.code)) {
    errors.code = '请输入6位数字验证码'
  }

  const passwordValidation = validatePassword(data.newPassword)
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.message
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = '请输入有效的邮箱地址'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
