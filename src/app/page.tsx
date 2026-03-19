'use client';

import { useState, useCallback } from 'react';
import type { EngineType, ProcessingState } from '@/types';
import { ENGINE_CONFIGS } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EngineSwitcher from '@/components/EngineSwitcher';
import UploadZone from '@/components/UploadZone';
import ProcessingView from '@/components/ProcessingView';
import ResultView from '@/components/ResultView';
import PrivacyConfirm from '@/components/PrivacyConfirm';
import Toast from '@/components/Toast';
import { validateFile } from '@/utils/validation';
import { downloadBlob, generateDownloadFilename } from '@/utils/download';
import { applyBackgroundColor } from '@/utils/canvas';
import { useEngineManager } from '@/hooks/useEngineManager';

export default function HomePage() {
  // 引擎状态
  const [engine, setEngine] = useState<EngineType>('local');
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false);
  const [pendingEngine, setPendingEngine] = useState<EngineType | null>(null);

  // 处理状态
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { processImage } = useEngineManager();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // 切换引擎
  const handleEngineChange = useCallback((newEngine: EngineType) => {
    if (newEngine === engine) return;
    if (newEngine === 'cloud') {
      setPendingEngine(newEngine);
      setShowPrivacyConfirm(true);
    } else {
      setEngine(newEngine);
    }
  }, [engine]);

  const handleConfirmCloudSwitch = useCallback(() => {
    if (pendingEngine) setEngine(pendingEngine);
    setPendingEngine(null);
    setShowPrivacyConfirm(false);
  }, [pendingEngine]);

  const handleCancelCloudSwitch = useCallback(() => {
    setPendingEngine(null);
    setShowPrivacyConfirm(false);
  }, []);

  // 处理文件上传
  const handleFileSelect = useCallback(async (file: File) => {
    const config = ENGINE_CONFIGS[engine];

    // 校验文件
    try {
      const validation = await validateFile(file, config);
      if (!validation.valid) {
        showToast(validation.error || '文件校验失败');
        return;
      }
    } catch (err) {
      showToast('文件校验异常，请重试');
      return;
    }

    // 保存文件信息
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    setResultBlob(null);
    setResultUrl(null);
    setBackgroundColor(null);

    // 开始处理
    try {
      const result = await processImage(file, engine, (state: Partial<ProcessingState>) => {
        setProcessingState((prev) => ({ ...prev, ...state }));
      });

      setResultBlob(result.blob);
      setResultUrl(URL.createObjectURL(result.blob));
      setProcessingState({
        status: 'done',
        engineUsed: result.engineUsed,
        fallbackUsed: result.fallbackUsed,
      });

      if (result.fallbackUsed) {
        showToast('云端处理失败，已自动切换到免费模式');
      }
    } catch (error) {
      setProcessingState({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '处理失败，请重试',
        progress: undefined,
        progressText: undefined,
      });
    }
  }, [engine, processImage, showToast]);

  // 处理下载
  const handleDownload = useCallback(async () => {
    if (!resultBlob || !originalFile) return;

    try {
      let blobToDownload = resultBlob;
      if (backgroundColor) {
        blobToDownload = await applyBackgroundColor(resultBlob, backgroundColor);
      }

      const filename = generateDownloadFilename(originalFile.name, processingState.engineUsed || engine);
      downloadBlob(blobToDownload, filename);
    } catch {
      showToast('下载失败，请重试');
    }
  }, [resultBlob, originalFile, backgroundColor, processingState.engineUsed, engine, showToast]);

  // 重新上传
  const handleReupload = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessingState({ status: 'idle' });
    setOriginalFile(null);
    setOriginalUrl(null);
    setResultBlob(null);
    setResultUrl(null);
    setBackgroundColor(null);
  }, [originalUrl, resultUrl]);

  // 重试
  const handleRetry = useCallback(() => {
    if (originalFile) {
      handleFileSelect(originalFile);
    }
  }, [originalFile, handleFileSelect]);

  // 状态判断
  const isProcessing = ['uploading', 'loading-model', 'processing'].includes(processingState.status);
  const showResult = processingState.status === 'done' && resultUrl;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-4">
        {/* 引擎切换 */}
        <EngineSwitcher
          currentEngine={engine}
          onEngineChange={handleEngineChange}
          disabled={isProcessing ? true : false}
        />

        {/* 主内容区 */}
        {isProcessing ? (
          <ProcessingView
            state={processingState}
            originalUrl={originalUrl}
            onRetry={handleRetry}
          />
        ) : showResult ? (
          <ResultView
            originalUrl={originalUrl!}
            resultUrl={resultUrl!}
            engineUsed={processingState.engineUsed!}
            fallbackUsed={processingState.fallbackUsed}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            onDownload={handleDownload}
            onReupload={handleReupload}
          />
        ) : (
          <UploadZone
            engineConfig={ENGINE_CONFIGS[engine]}
            onFileSelect={handleFileSelect}
          />
        )}
      </main>

      <Footer engine={engine} />

      {/* 隐私确认弹窗 */}
      <PrivacyConfirm
        isOpen={showPrivacyConfirm}
        onConfirm={handleConfirmCloudSwitch}
        onCancel={handleCancelCloudSwitch}
      />

      {/* Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
