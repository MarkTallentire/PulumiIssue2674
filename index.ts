import * as pulumi from "@pulumi/pulumi";
import * as azure_native from "@pulumi/azure-native"

const stack = pulumi.getStack();

const resourceGroup = new azure_native.resources.ResourceGroup(
    `rsg-${stack}`
  );
  
  const virtualNetwork = new azure_native.network.VirtualNetwork(
    `vnet-${stack}`,
    {
      addressSpace: {
        addressPrefixes: ["192.168.28.0/28"],
      },
      resourceGroupName: resourceGroup.name,
    }
  );
  
  const subnet = new azure_native.network.Subnet(
    `subnet-${stack}`,
    {
      addressPrefix: "192.168.28.0/28",
      resourceGroupName: resourceGroup.name,
      virtualNetworkName: virtualNetwork.name,
      serviceEndpoints: [
        {
          service: "Microsoft.Storage",
        },
      ],
    }
  );

  const publicIPAddress = new azure_native.network.PublicIPAddress(
    `pip-${stack}`,
    {
      resourceGroupName: resourceGroup.name,
      publicIPAddressVersion: "IPv4",
      publicIPAllocationMethod: "Static",

      sku: {
        name: "Standard",
        tier: "Regional",
      },
    },
  );

  const networkSecurityGroup = new azure_native.network.NetworkSecurityGroup(
    `nsg-${stack}`,
    {
      resourceGroupName: resourceGroup.name,
    },
  );

  const nic = new azure_native.network.NetworkInterface(
    `nic-${stack}`,
    {
      ipConfigurations: [
        {
          name: `publicIpConfig1`,
          publicIPAddress: {
            id: publicIPAddress.id,
          },
          subnet: {
            id: subnet.id,
          },
        },
      ],
      resourceGroupName: resourceGroup.name,
      networkSecurityGroup: { id: networkSecurityGroup.id },
    },
  );

  const vm = new azure_native.compute.VirtualMachine(
    `vm-${stack}`,
    {
      hardwareProfile: {
        vmSize: "Standard_B2s",
      },
      location: "westeurope",
      networkProfile: {
        networkInterfaces: [
          {
            id: nic.id,
            primary: true,
          },
        ],
      },
      osProfile: {
        adminUsername: "testuser",
        adminPassword: "Test1234@",
        computerName: `vm-${stack}`,
        linuxConfiguration: {
          disablePasswordAuthentication: false,                    
          patchSettings: {
            assessmentMode: "AutomaticByPlatform",
            automaticByPlatformSettings: {
              bypassPlatformSafetyChecksOnUserSchedule: true,
              rebootSetting: "Never",
            },
            patchMode: "AutomaticByPlatform",
          },
          provisionVMAgent: true,
        },
      },
      resourceGroupName: resourceGroup.name,
      storageProfile: {
        imageReference: {
          offer: "0001-com-ubuntu-server-jammy",
          publisher: "Canonical",
          sku: "22_04-lts-gen2",
          version: "latest",
        },
        osDisk: {
          caching: azure_native.compute.CachingTypes.ReadWrite,
          createOption: "FromImage",
          managedDisk: {
            storageAccountType: "Premium_LRS",
          },
        },
      },
    },
    {
      replaceOnChanges: ["storageProfile.imageReference"], //This will fail without also using deleteBeforeReplace causing downtime when the image changes
    } 
  );