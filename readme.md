### A minimum reproduction repository for pulumi issue: https://github.com/pulumi/pulumi-azure-native/issues/2674 ###

Steps to reproduce:
- `npm i`
- `pulumi up`
- change line `109 (offer:)` in `index.ts` to `0001-com-ubuntu-server-focal-daily` or other valid offer type
- change line `111 (sku:)` in `index.ts` to `20_04-daily-lts-gen2` or other valid sku type
- `pulumi up`

The VM will fail to recreate due to the NIC still being attached. This can be resolved by adding `deleteBeforeReplace: true` however this will cause downtime while the VM recreates.

Desired Behavious: 

- A new VM should be created and the NIC re-allocated to the new VM before the old VM is destroyed.