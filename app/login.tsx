import { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, ChevronLeft } from 'lucide-react-native';
import { sendOtp, verifyOtp } from '@/api/endpoints';
import { useAuth } from '@/api/AuthContext';
import { colors, font, radius } from '@/theme/tokens';
import { AmpMark, Btn, Display, ErrorNote, Txt } from '@/components/ui';

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^0+/, '');
  return `+91${digits}`;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPhone = async () => {
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setBusy(true); setError(null);
    try {
      const res = await sendOtp(normalizePhone(phone));
      setDevOtp(res.dev_otp);
      setStep('otp');
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const submitOtp = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }
    setBusy(true); setError(null);
    try {
      const res = await verifyOtp(normalizePhone(phone), otp);
      await signIn(res.access_token);
    } catch (e: any) { setError(e.message); setBusy(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 60, gap: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <AmpMark size={64} />
          <Display size={26} style={{ marginTop: 16 }}>
            Amp<Display size={26} color={colors.brand}>locate</Display>
          </Display>
          <Txt size={12} color={colors.textTertiary} family={font.semi} style={{ marginTop: 6, letterSpacing: 1 }}>
            CHARGE WITH CONFIDENCE
          </Txt>
        </View>

        {step === 'phone' ? (
          <>
            <Display size={20}>Welcome</Display>
            <Txt size={13} color={colors.textSecondary}>Log in or sign up with your mobile number.</Txt>
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
              borderRadius: radius.r4, borderWidth: 1, borderColor: colors.line2, paddingHorizontal: 16,
            }}>
              <Txt size={15} color={colors.textSecondary} family={font.semi}>+91</Txt>
              <TextInput
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                placeholder="98765 43210"
                placeholderTextColor={colors.textTertiary}
                style={{ flex: 1, padding: 16, fontSize: 16, color: colors.textPrimary, fontFamily: font.med }}
              />
            </View>
            {error && <ErrorNote message={error} />}
            <Btn label={busy ? 'Sending…' : 'Send OTP'} loading={busy} disabled={phone.length !== 10} onPress={submitPhone} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={13} color={colors.textTertiary} />
              <Txt size={11} color={colors.textTertiary}>We never share your number. No spam, ever.</Txt>
            </View>
          </>
        ) : (
          <>
            <Pressable onPress={() => { setStep('phone'); setOtp(''); setError(null); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={16} color={colors.textSecondary} />
              <Txt size={13} color={colors.textSecondary} family={font.med}>Change number</Txt>
            </Pressable>
            <Display size={20}>Verify it's you</Display>
            <Txt size={13} color={colors.textSecondary}>
              Enter the 6-digit code sent to +91 {phone}
            </Txt>
            {devOtp && (
              <View style={{ backgroundColor: colors.amberSoft, borderRadius: radius.r3, padding: 12 }}>
                <Txt size={13} color={colors.amber}>
                  Dev mode — your code is <Txt size={13} color={colors.amber} family={font.mono}>{devOtp}</Txt>
                </Txt>
              </View>
            )}
            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="••••••"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              style={{
                backgroundColor: colors.surface, borderRadius: radius.r4, borderWidth: 1,
                borderColor: colors.line2, padding: 18, fontSize: 24, letterSpacing: 12,
                textAlign: 'center', color: colors.textPrimary, fontFamily: font.bold,
              }}
            />
            {error && <ErrorNote message={error} />}
            <Btn label={busy ? 'Verifying…' : 'Verify & Continue'} loading={busy} disabled={otp.length !== 6} onPress={submitOtp} />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
