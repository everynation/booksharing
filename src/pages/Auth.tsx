import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Book } from "lucide-react";
import { AddressInput } from "@/components/AddressInput";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [address, setAddress] = useState("");
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      toast({
        title: "주소를 입력해주세요",
        description: "회원가입을 위해 주소 정보가 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast({
            title: "계정이 이미 존재합니다",
            description: "로그인 탭으로 이동해서 로그인해 주세요.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "회원가입 오류",
            description: authError.message,
            variant: "destructive",
          });
        }
        return;
      }

      // 2. 프로필에 주소 정보 추가 (회원가입 성공 시에만)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            address: address,
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          // 프로필 업데이트 실패해도 회원가입은 성공으로 처리
        }
      }

      toast({
        title: "회원가입 완료",
        description: "이메일을 확인하여 계정을 활성화하세요.",
      });
      
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "로그인 실패",
            description: "이메일 또는 비밀번호가 올바르지 않습니다.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "로그인 오류",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        });
        console.log("🔐 Login successful, navigating to /books");
        navigate("/books");
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "이메일을 입력해주세요",
        description: "비밀번호 재설정을 위해 이메일 주소가 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "오류가 발생했습니다",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "비밀번호 재설정 이메일 발송",
          description: "이메일을 확인하여 비밀번호를 재설정하세요.",
        });
        setResetMode(false);
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) {
        toast({
          title: "카카오 로그인 오류",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center justify-center gap-3 mb-8 hover:opacity-80 transition-opacity"
        >
          <Book className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">옆집책꽂이</h1>
        </button>

        <Card className="border border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>계정 관리</CardTitle>
            <CardDescription>
              옆집책꽂이에 오신 것을 환영합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">로그인</TabsTrigger>
                <TabsTrigger value="signup">회원가입</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                {resetMode ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">이메일</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                      variant="warm"
                    >
                      {loading ? "발송 중..." : "비밀번호 재설정 이메일 발송"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => setResetMode(false)}
                    >
                      로그인으로 돌아가기
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">이메일</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">비밀번호</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                      variant="warm"
                    >
                      {loading ? "로그인 중..." : "로그인"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full text-sm" 
                      onClick={() => setResetMode(true)}
                    >
                      비밀번호를 잊으셨나요?
                    </Button>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground">또는</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      variant="secondary"
                      onClick={handleKakaoLogin}
                      disabled={loading}
                    >
                      카카오로 계속하기
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">이름</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="홍길동"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-address">주소</Label>
                    <AddressInput
                      value={address}
                      onChange={(newAddress, coordinates) => {
                        setAddress(newAddress);
                        setAddressCoordinates(coordinates || null);
                      }}
                      placeholder="주소를 검색하세요"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    variant="warm"
                  >
                    {loading ? "가입 중..." : "회원가입"}
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">또는</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    variant="secondary"
                    onClick={handleKakaoLogin}
                    disabled={loading}
                  >
                    카카오로 계속하기
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;