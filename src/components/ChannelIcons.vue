<script setup lang="ts">
import { APP_NAME, GITHUB, Host, Origin } from "@/config/env.ts";
import BaseIcon from "@/components/BaseIcon.vue";
import { defineAsyncComponent, onMounted, ref, watch } from "vue";
import { usePracticeStore } from "@/stores/practice.ts";
import { useBaseStore } from "@/stores/base.ts";
import { msToHourMinute } from "@/utils";
import dayjs from "dayjs";
import BaseButton from "@/components/BaseButton.vue";
import Toast from "@/components/base/toast/Toast.ts";
import { useUserStore } from "@/stores/user.ts";

const Dialog = defineAsyncComponent(() => import('@/components/dialog/Dialog.vue'))

const practiceStore = usePracticeStore()
const baseStore = useBaseStore()
const userStore = useUserStore()

let showWechatDialog = $ref(false)
let showXhsDialog = $ref(false)
let showQQDialog = $ref(false)
let showShareImageDialog = $ref(false)
let isGeneratingImage = $ref(false)
let generatedImageUrl = $ref<string | null>(null)

// 计算学习统计数据
const studyStats = $computed(() => {
  const accuracyRate = practiceStore.total === 0 ? 100 : Math.round(((practiceStore.total - practiceStore.wrong) / practiceStore.total) * 100)
  const studyTime = msToHourMinute(practiceStore.spend).replace('小时', 'h ').replace('分钟', 'm')

  return {
    total: practiceStore.total,
    newWords: practiceStore.newWordNumber,
    review: practiceStore.reviewWordNumber + practiceStore.writeWordNumber,
    wrong: practiceStore.wrong,
    correct: practiceStore.total - practiceStore.wrong,
    accuracy: accuracyRate,
    time: studyTime,
    date: dayjs().format('MM月DD日'),
    dictionary: baseStore.sdict.name || '未知词书'
  }
})

// 监听对话框打开事件，自动生成图片
watch(() => showShareImageDialog, (newVal) => {
  if (newVal && !generatedImageUrl) {
    generateShareImage()
  }
})

// 生成分享图片
async function generateShareImage() {
  if (isGeneratingImage || generatedImageUrl) return

  isGeneratingImage = true

  try {
    // 创建canvas元素
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 设置尺寸为1.3倍高度比例 (宽度720，高度936)
    const width = 720
    const height = Math.round(width * 1.3)

    // let canvasRect = canvas.getBoundingClientRect()
    // let {width, height} = canvasRect
    let dpr = window.devicePixelRatio
    if (dpr) {
      canvas.style.width = width + "px"
      canvas.style.height = height + "px"
      canvas.height = height * dpr
      canvas.width = width * dpr
      ctx.scale(dpr, dpr)
    }

    // canvas.width = width
    // canvas.height = height

    if (!ctx) return

    // 创建灰黑色渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#1f2937')
    gradient.addColorStop(1, '#111827')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)


    // 设置文字样式
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'

    ctx.font = '24px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText(dayjs().format('YYYY年MM月DD日'), width * 0.05, height * 0.08)

    // 右上角标签
    ctx.textAlign = 'right'
    ctx.font = '24px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText('Type Words | 英语学习', width * 0.95, height * 0.08)

    // 右上角标签
    ctx.textAlign = 'left'
    ctx.font = '36px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(`我在 ${APP_NAME} 学习了${studyStats.time}`, width * 0.05, height * 0.18)

    // 统计数据区域 (三个圆角矩形)
    const statsY = height * 0.25
    const statWidth = width * 0.25
    const statHeight = height * 0.12
    const statSpacing = width * 0.05

    const stats = [
      {label: '正确率', value: studyStats.accuracy + '%', color: '#f59e0b'},
      {label: '新词', value: studyStats.newWords, color: '#60a5fa'},
      {label: '复习', value: studyStats.review, color: '#34d399'}
    ]

    // stats.forEach((stat, index) => {
    //   const x = width * 0.1 + index * (statWidth + statSpacing)
    //   const y = statsY
    //
    //   // 绘制圆角矩形背景
    //   ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    //   roundRect(ctx, x, y, statWidth, statHeight, 15)
    //   ctx.fill()
    //
    //   // 数值
    //   ctx.fillStyle = '#ffffff'
    //   ctx.font = 'bold 24px Arial'
    //   ctx.textAlign = 'center'
    //   ctx.fillText(stat.value.toString(), x + statWidth / 2, y + statHeight * 0.4)
    //
    //   // 标签
    //   ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    //   ctx.font = '12px Arial'
    //   ctx.fillText(stat.label, x + statWidth / 2, y + statHeight * 0.7)
    // })

    // 励志语句
    // ctx.textAlign = 'center'
    // ctx.fillStyle = '#ffffff'
    // ctx.font = 'italic 20px Arial'
    // ctx.fillText('Keep going, never give up!', width / 2, height * 0.45)
    //
    // ctx.font = '16px Arial'
    // ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    // ctx.fillText('坚持就是胜利', width / 2, height * 0.5)

    // 底部品牌信息
    const bottomY = height * 0.65
    const brandX = width * 0.1


    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.fillText(APP_NAME, brandX, bottomY)

    ctx.font = '24px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText('词文记 - 高效英语学习', brandX, bottomY + 30)
    ctx.fillText(Host, brandX, bottomY + 55)

    // 二维码区域
    const qrX = width * 0.75
    const qrY = bottomY - 10

    // 二维码背景
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, qrX - 5, qrY - 5, 50, 50, 5)
    ctx.fill()

    // 绘制简单二维码
    ctx.fillStyle = '#000000'
    const moduleSize = 2
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 20; col++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(qrX + col * moduleSize, qrY + row * moduleSize, moduleSize, moduleSize)
        }
      }
    }

    // 将canvas转换为图片
    const imageUrl = canvas.toDataURL('image/png', 1.0)
    generatedImageUrl = imageUrl

  } catch (error) {
    console.error('生成图片失败:', error)
    alert('生成图片失败，请重试')
  } finally {
    isGeneratingImage = false
  }
}

// 复制图片到剪贴板
async function copyImageToClipboard() {
  if (!generatedImageUrl) return

  try {
    const response = await fetch(generatedImageUrl)
    const blob = await response.blob()

    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])
      Toast.success('图片已复制到剪贴板！')
    } else {
      // 降级方案：下载图片
      downloadImage()
    }
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：下载图片
    downloadImage()
  }
}

// 下载图片
function downloadImage() {
  if (!generatedImageUrl) return

  const link = document.createElement('a')
  link.download = `${APP_NAME} 分享_${studyStats.date}_${studyStats.dictionary}.png`
  link.href = generatedImageUrl
  link.click()
}

// 切换背景
function changeBackground() {
  // 这里可以实现背景切换逻辑
  console.log('切换背景')
}

// 绘制圆角矩形辅助函数
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

onMounted(generateShareImage)
</script>

<template>
  <div class="flex-col center gap-1">
    <!-- 分享学习总结按钮 -->
    <BaseIcon @click="showShareImageDialog = true"
              class="cursor-pointer hover:scale-110 transition-transform duration-200">
      <IconFluentShare20Regular class="text-blue-500 hover:text-blue-600"/>
    </BaseIcon>

    <a
        :href="GITHUB"
        target="_blank"
        rel="noreferrer"
        aria-label="GITHUB 项目地址">
      <BaseIcon>
        <IconSimpleIconsGithub/>
      </BaseIcon>
    </a>

    <BaseIcon @click="showWechatDialog = true">
      <IconSimpleIconsWechat class="color-green-500"/>
    </BaseIcon>
    <BaseIcon @click="showQQDialog = true">
      <IconUiwQq class="color-red"/>
    </BaseIcon>
    <BaseIcon @click="showXhsDialog = true">
      <IconSimpleIconsXiaohongshu class="color-red-500"/>
    </BaseIcon>

    <a
        href="https://x.com/typewords2"
        target="_blank"
        rel="noreferrer"
        aria-label="关注我的 X 账户 typewords2">
      <BaseIcon>
        <IconRiTwitterFill class="color-blue"/>
      </BaseIcon>
    </a>

    <a
        href="mailto:zyronon@163.com"
        target="_blank"
        rel="noreferrer"
        aria-label="发送邮件到 zyronon@163.com">
      <BaseIcon>
        <IconMaterialSymbolsMail class="color-blue"/>
      </BaseIcon>
    </a>
  </div>

  <!-- 学习总结分享图片生成对话框 -->
  <Dialog
      title="分享"
      :close-on-click-bg="true"
      @close="generatedImageUrl = null"
      custom-class="!max-w-4xl !w-auto">
    <div class="flex min-w-160 max-w-200 p-6 pt-0 gap-space">
      <!-- 左侧：海报预览区域 -->
      <div class="flex-1 border-r border-gray-200">
        <!-- 海报预览 -->
        <div v-if="generatedImageUrl" class="relative">
          <img
              :src="generatedImageUrl"
              alt="学习总结海报"
              class="w-full h-auto rounded-xl shadow-lg">
        </div>

        <!-- 默认预览状态 -->
        <div v-else
             class="w-80 h-104 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white relative overflow-hidden">
          <!-- 背景装饰 -->
          <div class="absolute top-4 right-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
          <div class="absolute bottom-8 left-8 w-12 h-12 bg-white bg-opacity-5 rounded-full"></div>

          <!-- 顶部用户信息 -->
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 bg-gray-600 rounded-full mr-3 flex items-center justify-center">
              <IconSimpleIconsGithub class="w-6 h-6 text-white"/>
            </div>
            <div>
              <div class="font-semibold text-lg">{{ baseStore.user?.name || '学习者' }}</div>
              <div class="text-gray-300 text-sm">{{ dayjs().format('YYYY年MM月DD日') }}</div>
            </div>
            <div class="ml-auto text-xs text-gray-300">
              Type Words | 英语学习
            </div>
          </div>

          <!-- 统计数据 -->
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="text-center">
              <div class="text-2xl font-bold">{{ studyStats.total }}</div>
              <div class="text-gray-300 text-xs">总词数</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold">{{ studyStats.time }}</div>
              <div class="text-gray-300 text-xs">学习时长</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold">{{ studyStats.accuracy }}%</div>
              <div class="text-gray-300 text-xs">正确率</div>
            </div>
          </div>

          <!-- 励志语句 -->
          <div class="text-center mb-8">
            <div class="text-lg italic mb-2">Keep going, never give up!</div>
            <div class="text-sm text-gray-300">坚持就是胜利</div>
          </div>

          <!-- 底部品牌信息 -->
          <div class="absolute bottom-6 left-6 right-6">
            <div class="flex justify-between items-end">
              <div>
                <div class="font-bold text-lg">Type Words</div>
                <div class="text-xs text-gray-300">词文记 - 高效英语学习</div>
                <div class="text-xs text-gray-400">{{ window.location.origin }}</div>
              </div>
              <div class="w-16 h-16 bg-white rounded p-2">
                <div class="w-full h-full bg-black grid grid-cols-8 gap-0.5">
                  <div v-for="i in 64" :key="i" :class="Math.random() > 0.5 ? 'bg-black' : 'bg-white'"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：分享引导区域 -->
      <div class="flex-1 pt-0 space-y-6">
        <div class="">
          <div class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">🎯</span>
            分享你的进步
          </div>
          <div class="flex items-start">
            <span class="mr-2">🚀</span>
            在 {{ APP_NAME }}，学习英语也能成为超酷的事情！
          </div>
          <div class="flex items-start">
            <span class="mr-2">📸</span>
            快来分享你的学习图片，让你的进步刷屏朋友圈，成为最受瞩目的英语学霸！😎
          </div>
          <div class="flex items-start">
            <span class="mr-2">💪</span>
            这不只是简单的打卡，更是你秀出英语实力的舞台！
          </div>
          <div class="flex items-start">
            <span class="mr-2">🔥</span>
            分享你的战绩，收获朋友们的点赞和认可，让你的朋友圈也掀起一股英语学习的热潮！
          </div>
        </div>

        <!-- 个性化装扮 -->
        <div
            class="flex items-center justify-between px-6 py-3 bg-gray-200 rounded-lg cp  hover:bg-gray-100 transition-all duration-200">
          <div
              @click="changeBackground"
              class="flex items-center gap-2">
            <IconMdiSparkles class="w-4 h-4 text-yellow-500"/>
            换个背景
          </div>
          <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">随心装扮</span>
        </div>

        <!-- 分享战绩 -->
        <div
            @click="copyImageToClipboard"
            class="flex items-center justify-start gap-space px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white cp rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200">
          <IconFluentCopy20Regular class="w-5 h-5"/>
          <span class="font-medium">复制到剪贴板</span>
        </div>

        <div
            @click="downloadImage"
            class="flex items-center justify-start gap-space px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white cp rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200">
          <IconFluentArrowDownload20Regular class="w-5 h-5"/>
          <span class="font-medium">保存高清海报</span>
        </div>
      </div>
    </div>
  </Dialog>

  <Dialog v-model="showWechatDialog" title="Type Words 交流群">
    <div class="w-120 p-6 pt-0">
      <div class="mb-4">
        加入我们的用户社群后，您可以与我们的开发团队进行沟通，分享您的使用体验和建议，帮助我们改进产品，同时也能够及时了解我们的最新动态和更新内容。
      </div>
      <div class="text-center">
        <img src="/wechat.png" alt="微信群二维码" class="w-60 rounded-lg">
      </div>
    </div>
  </Dialog>
  <Dialog v-model="showXhsDialog" title="小红书">
    <div class="w-120 p-6 pt-0">
      <div class="mb-4">
        关注小红书后，您可以获得开发团队的最新动态和更新内容，反馈您的使用体验和建议，帮助我们改进产品，同时也能够及时了解我们的最新动态和更新内容。
      </div>
      <div class="text-center">
        <img src="/xhs.png" alt="小红书二维码" class="w-60 rounded-lg">
      </div>
    </div>
  </Dialog>
  <Dialog v-model="showQQDialog" title="QQ 交流群">
    <div class="w-120 p-6 pt-0">
      <div class="mb-4">
        <span>加入我们的用户社群后，您可以与我们的开发团队进行沟通，分享您的使用体验和建议，帮助我们改进产品，同时也能够及时了解我们的最新动态和更新内容。</span>
      </div>
      <div class="text-center">
        <img src="/qq.jpg" alt="QQ群二维码" class="w-60 rounded-lg">
      </div>
    </div>
  </Dialog>

</template>
<style scoped lang="scss">
a {
  color: unset;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>