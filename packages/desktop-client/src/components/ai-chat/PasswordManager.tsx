// @ts-strict-ignore
import React, { useState } from 'react';

import { theme } from '@actual-app/components/theme';
import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';

type PasswordManagerProps = {
  onComplete: () => void;
  mode: 'create' | 'unlock';
};

export function PasswordManager({ onComplete, mode }: PasswordManagerProps) {
  const [pwd, setPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    if (mode === 'create' && pwd !== confirmPwd) {
      setMsg('Passwords do not match');
      return;
    }

    if (pwd.length < 8) {
      setMsg('Password must be at least 8 characters');
      return;
    }

    setBusy(true);
    setMsg('');

    try {
      const { send } = await import('loot-core/platform/client/fetch');

      if (mode === 'create') {
        const outcome = await send('ai-chat-setup-master-password', {
          password: pwd,
        });

        if (outcome.success) {
          onComplete();
        } else {
          setMsg(outcome.error || 'Failed to set password');
        }
      } else {
        const outcome = await send('ai-chat-unlock-master-password', {
          password: pwd,
        });

        if (outcome.success) {
          onComplete();
        } else {
          setMsg('Incorrect password');
        }
      }
    } catch (err) {
      setMsg('An error occurred: ' + (err.message || 'Unknown'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        padding: 20,
        borderRadius: 8,
        backgroundColor: theme.tableBackground,
        border: `1px solid ${theme.pillBorder}`,
        maxWidth: 400,
        margin: '20px auto',
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 600, marginBottom: 15 }}>
        {mode === 'create' ? 'Create Master Password' : 'Unlock with Password'}
      </Text>

      {mode === 'create' && (
        <Text
          style={{
            fontSize: 13,
            marginBottom: 15,
            color: theme.pageTextSubdued,
          }}
        >
          This password will encrypt your API keys in the browser. You'll need
          it each time you open the app.
        </Text>
      )}

      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 6, fontSize: 13 }}>Password</Text>
        <Input
          type="password"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter' && mode === 'unlock') {
              handleSubmit();
            }
          }}
          disabled={busy}
          style={{ width: '100%' }}
        />
      </View>

      {mode === 'create' && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 6, fontSize: 13 }}>
            Confirm Password
          </Text>
          <Input
            type="password"
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            disabled={busy}
            style={{ width: '100%' }}
          />
        </View>
      )}

      {msg && (
        <Text
          style={{
            color: '#c62828',
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {msg}
        </Text>
      )}

      <View style={{ display: 'flex', gap: 10 }}>
        <Button
          onClick={handleSubmit}
          variant="primary"
          disabled={
            busy ||
            !pwd ||
            (mode === 'create' && (!confirmPwd || pwd !== confirmPwd))
          }
        >
          {busy ? 'Please wait...' : mode === 'create' ? 'Create' : 'Unlock'}
        </Button>
      </View>
    </View>
  );
}
