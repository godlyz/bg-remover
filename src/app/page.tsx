"use client"

import { useState, useCallback } from 'react'
import { SessionProvider } from 'next-auth/react'
import type { EngineType, ProcessingState } from '@/types'
import { CloudError } from '@/hooks/useCloudRemoval'
import { ENGINE_CONFIGS } from '@/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import EngineSwitcher from '@/components/EngineSwitcher'
import UploadZone from '@/components/UploadZone'
import ProcessingView from '@/components/ProcessingView'
import ResultView from '@/components/ResultView'
import PrivacyConfirm from '@/components/PrivacyConfirm'
import Toast from '@/components/Toast'
import QuotaExceededModal from '@/components/QuotaExceededModal'
import { validateFile } from '@/utils/validation'
import { downloadBlob, generateDownloadFilename } from '@/utils/download'
import { applyBackgroundColor } from '@/utils/canvas'
import { useEngineManager } from '@/hooks/useEngineManager'

function AppContent() {
  const [engine, setEngine] = useState<EngineType>('local');
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false);
  const [pendingEngine, setPendingEngine] = useState<EngineType | null>(null);
  const [quotaModal, setQuotaModal] = useState<{
    isOpen: boolean; type: 'guest' | 'free' | 'paid'; plan?: string; used?: number; total?: number
  }>({ isOpen: false, type: 'guest' })
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { processImage } = useEngineManager()

  const showToast = useCallback((msg: string) => { setToastMessage(msg) }, [])

  const handleEngineChange = useCallback((newEngine: EngineType) => {
    if (newEngine === engine) return
    if (newEngine === 'cloud') {
      setPendingEngine(newEngine)
      setShowPrivacyConfirm(true)
    } else {
      setEngine(newEngine)
    }
  }, [engine])

  const handleConfirmCloudSwitch = useCallback(() => {
    if (pendingEngine) setEngine(pendingEngine)
    setPendingEngine(null)
    setShowPrivacyConfirm(false)
  }, [pendingEngine])

  const handleCancelCloudSwitch = useCallback(() => {
    setPendingEngine(null)
    setShowPrivacyConfirm(false)
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    const config = ENGINE_CONFIGS[engine]
    try {
      const validation = await validateFile(file, config)
      if (!validation.valid) { showToast(validation.error || '文件校验失败'); return }
    } catch { showToast('文件校验异常，请重试'); return }

    setOriginalFile(file)
    setOriginalUrl(URL.createObjectURL(file))
    setResultBlob(null); setResultUrl(null); setBackgroundColor(null)

    try {
      const result = await processImage(file, engine, (state: Partial<ProcessingState>) => {
        setProcessingState((prev) => ({ ...prev, ...state }))
      })
      setResultBlob(result.blob)
      setResultUrl(URL.createObjectURL(result.blob))
      setProcessingState({ status: 'done', engineUsed: result.engineUsed, fallbackUsed: result.fallbackUsed })
      if (result.fallbackUsed) showToast('云端处理失败，已自动切换到免费模式')
    } catch (error) {
      // 用量不足 → 弹窗
      if (error instanceof CloudError && error.code === 'quota_exceeded' && error.data) {
        setProcessingState({ status: 'idle' })
        setQuotaModal({
          isOpen: true,
          type: error.data.type || 'guest',
          plan: error.data.plan,
          used: error.data.used,
          total: error.data.total,
        })
        return
      }
      // 其他错误
      setProcessingState({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '处理失败，请重试',
      })
    }
  }, [engine, processImage, showToast])

  const handleDownload = useCallback(async () => {
    if (!resultBlob || !originalFile) return
    try {
      let blobToDownload = resultBlob
      if (backgroundColor) blobToDownload = await applyBackgroundColor(resultBlob, backgroundColor)
      const filename = generateDownloadFilename(originalFile.name, processingState.engineUsed || engine)
      downloadBlob(blobToDownload, filename)
    } catch { showToast('下载失败，请重试') }
  }, [resultBlob, originalFile, backgroundColor, processingState.engineUsed, engine, showToast])

  const handleReupload = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setProcessingState({ status: 'idle' }); setOriginalFile(null); setOriginalUrl(null)
    setResultBlob(null); setResultUrl(null); setBackgroundColor(null)
  }, [originalUrl, resultUrl])

  const handleRetry = useCallback(() => {
    if (originalFile) handleFileSelect(originalFile)
  }, [originalFile, handleFileSelect])

  const isProcessing = ['uploading', 'loading-model', 'processing'].includes(processingState.status)
  const showResult = processingState.status === 'done' && resultUrl

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-4">
        <EngineSwitcher currentEngine={engine} onEngineChange={handleEngineChange} disabled={isProcessing} />
        {isProcessing ? (
          <ProcessingView state={processingState} originalUrl={originalUrl} onRetry={handleRetry} />
        ) : showResult ? (
          <ResultView
            originalUrl={originalUrl!} resultUrl={resultUrl!}
            engineUsed={processingState.engineUsed!} fallbackUsed={processingState.fallbackUsed}
            backgroundColor={backgroundColor} onBackgroundColorChange={setBackgroundColor}
            onDownload={handleDownload} onReupload={handleReupload}
          />
        ) : (
          <UploadZone engineConfig={ENGINE_CONFIGS[engine]} onFileSelect={handleFileSelect} />
        )}
      </main>
      <Footer engine={engine} />
      <PrivacyConfirm isOpen={showPrivacyConfirm} onConfirm={handleConfirmCloudSwitch} onCancel={handleCancelCloudSwitch} />
      <QuotaExceededModal
        isOpen={quotaModal.isOpen}
        onClose={() => setQuotaModal(prev => ({ ...prev, isOpen: false }))}
        type={quotaModal.type} plan={quotaModal.plan} used={quotaModal.used} total={quotaModal.total}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  )
}

export default function HomePage() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  )
}
