import React, { useState } from 'react';
import { ISBNScanner } from '@/components/ISBNScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Scan } from 'lucide-react';
import Header from '@/components/Header';

const TestScanner = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedISBN, setScannedISBN] = useState<string | null>(null);

  const handleScan = (isbn: string) => {
    setScannedISBN(isbn);
    console.log('Scanned ISBN:', isbn);
  };

  const handleClose = () => {
    setIsScannerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                바코드 스캐너 테스트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  ISBN 바코드 스캐너를 테스트해보세요. 갤럭시에서의 초점 문제가 해결되었는지 확인할 수 있습니다.
                </p>
                
                <Button 
                  onClick={() => setIsScannerOpen(true)}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  스캐너 열기
                </Button>
              </div>

              {scannedISBN && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">스캔 성공!</h3>
                  <p className="text-green-700">ISBN: {scannedISBN}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setScannedISBN(null)}
                    className="mt-2"
                  >
                    초기화
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold">테스트 방법:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>위의 "스캐너 열기" 버튼을 클릭하세요</li>
                  <li>카메라 권한을 허용하세요</li>
                  <li>책 뒷면의 ISBN 바코드를 프레임 안에 맞추세요</li>
                  <li>ZXing 라이브러리가 바코드를 자동으로 인식합니다</li>
                  <li>갤럭시에서도 초점이 잘 맞는지 확인해보세요</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">개선된 기능:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>QuaggaJS 라이브러리로 강력한 바코드 인식</li>
                  <li>갤럭시 특별 최적화 설정 (낮은 해상도로 초점 안정성 향상)</li>
                  <li>자동 초점 및 노출 조정</li>
                  <li>수동 초점 조정 기능 (갤럭시용)</li>
                  <li>1초마다 자동 초점 재설정</li>
                  <li>스캔 영역 제한으로 정확도 향상</li>
                  <li>스캔 중 시각적 피드백</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ISBNScanner
        isOpen={isScannerOpen}
        onScan={handleScan}
        onClose={handleClose}
      />
    </div>
  );
};

export default TestScanner;
