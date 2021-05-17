import React, { useMemo, useState, useEffect } from 'react';
import { Tooltip, Popover, IconButton } from '@material-ui/core';
import SwapHoriz from '@material-ui/icons/SwapHoriz';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Swap from '@project-serum/swap-ui';
import { Provider } from '@project-serum/anchor';
import { TransactionSignature } from '@solana/web3.js';
import {
  TokenListContainer,
  TokenListProvider,
} from '@solana/spl-token-registry';
import { useTokenInfos } from '../utils/tokens/names';
import { useSendTransaction } from '../utils/notifications';
import { useWallet } from '../utils/wallet';
import { useConnection } from '../utils/connection';

export default function SwapButton() {
  const [sendTransaction] = useSendTransaction();
  const connection = useConnection();
  const wallet = useWallet();
  const tokenInfos = useTokenInfos();
  const tokenList = useMemo(() => {
    return new TokenListContainer(tokenInfos);
  }, [tokenInfos]);
  const provider = useMemo(() => {
    return new NotifyingProvider(connection, wallet, sendTransaction);
  }, [connection, wallet, sendTransaction]);
  return (
    <PopupState variant="popover">
      {(popupState) => (
        <div style={{ display: 'flex' }}>
          <Tooltip title="Swap tokens">
            <IconButton {...bindTrigger(popupState)}>
              <SwapHoriz />
            </IconButton>
          </Tooltip>
          <Popover
            {...bindPopover(popupState)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{ style: { borderRadius: '10px' } }}
            disableRestoreFocus
          >
            <Swap provider={provider} tokenList={tokenList} />
          </Popover>
        </div>
      )}
    </PopupState>
  );
}

class NotifyingProvider extends Provider {
  constructor(
    connection: Connection,
    wallet: Wallet,
    sendTransaction: (Promise<TransactionSignature>, Function) => void,
  ) {
    super(connection, wallet, {
      commitment: 'recent',
    });
    this.sendTransaction = sendTransaction;
  }

  async send(
    tx: Transaction,
    signers?: Array<Account | undefined>,
    opts?: ConfirmOptions,
  ): Promise<TransactionSignature> {
    return new Promise((resolve, reject) => {
      this.sendTransaction(super.send(tx, signers, opts), {
        onSuccess: (signature) => {
          resolve(signature);
        },
        onError: (e) => {
          reject(e);
        },
      });
    });
  }
}
