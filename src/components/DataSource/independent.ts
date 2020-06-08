import { ValueRef } from '@holoflows/kit/es'
import Services from '../../extension/service'
import { PersonaArrayComparer } from '../../utils/comparer'
import { MessageCenter } from '../../utils/messages'
import type { Persona } from '../../database'
import { useValueRef } from '../../utils/hooks/useValueRef'
import { PluginMessageCenter } from '../../plugins/PluginMessages'
import { ethereumNetworkSettings } from '../../plugins/Wallet/network'
import type { WalletRecord, ERC20TokenRecord } from '../../plugins/Wallet/database/types'
import { sideEffect } from '../../utils/side-effects'

const independentRef = {
    myPersonasRef: new ValueRef<Persona[]>([], PersonaArrayComparer),
    myUninitializedPersonasRef: new ValueRef<Persona[]>([], PersonaArrayComparer),
    walletTokenRef: new ValueRef<[(WalletRecord & { privateKey: string })[], ERC20TokenRecord[]]>([[], []]),
}

{
    const ref = sideEffect.then(query)
    MessageCenter.on('personaUpdated', query)
    function query() {
        Services.Identity.queryMyPersonas().then((p) => {
            independentRef.myPersonasRef.value = p.filter((x) => !x.uninitialized)
            independentRef.myUninitializedPersonasRef.value = p.filter((x) => x.uninitialized)
        })
    }
}

{
    const ref = independentRef.walletTokenRef
    sideEffect.then(query)
    PluginMessageCenter.on('maskbook.wallets.update', query)
    ethereumNetworkSettings.addListener(query)
    function query() {
        Services.Plugin.invokePlugin('maskbook.wallet', 'getWallets').then((x) => (ref.value = x))
    }
}

export function useMyPersonas() {
    return useValueRef(independentRef.myPersonasRef)
}

export function useMyUninitializedPersonas() {
    return useValueRef(independentRef.myUninitializedPersonasRef)
}

export function useMyWallets() {
    return useValueRef(independentRef.walletTokenRef)
}
