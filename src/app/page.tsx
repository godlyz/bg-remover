'use client';

import { useState, useCallback } from 'react';
import { EngineType, ProcessingState, ENGINE_CONFIGS } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EngineSwitcher from '@/components/EngineSwitcher';
import UploadZone from '@/components/UploadZone';
import ProcessingView from '@/components/ProcessingView';
import ResultView from '@/components/ResultView';
import ColorPicker from '@/components/ColorPicker';
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

  // Toast 状态
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { processImage } = useEngineManager();

  // 切换引擎
  const handleEngineChange = (newEngine: EngineType) => {
    if (newEngine === 'cloud') {
      setPendingEngine(newEngine);
      setShowPrivacyConfirm(true);
    } else {
      setEngine(newEngine);
    }
  };

  // 确认切换到云端
  const handleConfirmCloudSwitch = () => {
    if (pendingEngine) {
      setEngine(pendingEngine);
      setPendingEngine(null);
    }
    setShowPrivacyConfirm(false);
  };

  // 取消切换
  const handleCancelCloudSwitch = () => {
    setPendingEngine(null);
    setShowPrivacyConfirm(false);
  };

  // 处理文件上传
  const handleFileSelect = async (file: File) => {
    const config = ENGINE_CONFIGS[engine];

    // 校验文件
    const validation = await validateFile(file, config);
    if (!validation.valid) {
      setToastMessage(validation.error || '文件校验失败');
      return;
    }

    // 保存文件信息
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    setResultBlob(null);
    setResultUrl(null);

    // 开始处理
    try {
      const { blob, engineUsed, fallbackUsed } = await processImage(file, engine, (state: Partial<ProcessingState>) => {
        setProcessingState((prev) => ({ ...prev, ...state, engineUsed }));
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setProcessingState({
        status: 'done',
        engineUsed,
        fallbackUsed,
      });

      if (fallbackUsed) {
        setToastMessage('云端处理失败，已自动切换到免费模式');
      }
    } catch (error) {
      setProcessingState({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '处理失败，请重试',
      });
    }
  };

  // 处理下载
  const handleDownload = async () => {
    if (!resultBlob || !originalFile) return;

    try {
      let blobToDownload = resultBlob;

      // 如果选择了背景色，先合成
      if (backgroundColor) {
        blobToDownload = await applyBackgroundColor(resultBlob, backgroundColor);
      }

      const filename = generateDownloadFilename(originalFile.name, processingState.engineUsed || 'local');
      downloadBlob(blobToDownload, filename);
    } catch (error) {
      setToastMessage('下载失败，请重试');
    }
  };

  // 重新上传
  const handleReupload = () => {
    setProcessingState({ status: 'idle' });
    setOriginalFile(null);
    setOriginalUrl(null);
    setResultBlob(null);
    setResultUrl(null);
    setBackgroundColor(null);
  };

  // 重试处理
  const handleRetry = () => {
    if (originalFile) {
      handleFileSelect(originalFile);
    }
  };

  // 判断当前是否在处理中
  const isProcessing = ['uploading', 'loading-model', 'processing'].includes(processingState.status);
  const showResult = processingState.status === 'done' && resultUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pb-12">
        {/* 引擎切换 */}
        <EngineSwitcher
          currentEngine={engine}
          onEngineChange={handleEngineChange}
          disabled={isProcessing || showResult ? true : false}
        />

        {/* 主内容区 */}
        {isProcessing ? (
          <ProcessingView state={processingState} onRetry={handleRetry} />
        ) : showResult ? (
          <>
            <ResultView
              originalUrl={originalUrl!}
              resultUrl={resultUrl!}
              engineUsed={processingState.engineUsed!}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              onDownload={handleDownload}
              onReupload={handleReupload}
            />
            <div className="mx-auto mt-4 max-w-5xl px-4">
              <ColorPicker
                selectedColor={backgroundColor}
                onColorSelect={setBackgroundColor}
              />
            </div>
          </>
        ) : (
          <UploadZone
            engineConfig={ENGINE_CONFIGS[engine]}
            onFileSelect={handleFileSelect}
            disabled={false}
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

      {/* Toast 提示 */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
