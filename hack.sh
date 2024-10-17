#!/bin/bash

# Make sure to start from base workspace folder
SDK_WORKSPACE_DIR="/Volumes/FD/Projects/metamask/metamask-sdk/";
COMM_LAYER_DIR="$SDK_WORKSPACE_DIR/packages/sdk-communication-layer/dist"
SDK_DIR="$SDK_WORKSPACE_DIR/packages/sdk/dist"

DAPP_DIR="/Volumes/FD/Projects/metamask/connector_compare/pure_sdk"

echo "SDK_DIR: $SDK_DIR"
echo "COMM_LAYER_DIR: $COMM_LAYER_DIR"
echo "DAPP_DIR: $DAPP_DIR"

echo "########### START REPLACING SDK_COMMUNICATION_LAYER #########"

cd $DAPP_DIR
echo "Hack Metamask sdk && sdk-communication-layer packages..."

## hack to debug to latest unpublished version of the sdk
echo "Deleting old dist folders..."
if [ -d "$DAPP_DIR/node_modules/@metamask/sdk-communication-layer/dist" ]; then
    echo "Deleting: $DAPP_DIR/node_modules/@metamask/sdk-communication-layer/dist"
    rm -rf "$DAPP_DIR/node_modules/@metamask/sdk-communication-layer/dist"
else
    echo "Directory not found: $DAPP_DIR/node_modules/@metamask/sdk-communication-layer/dist"
fi

if [ -d "$DAPP_DIR/node_modules/@metamask/sdk/dist" ]; then
    echo "Deleting: $DAPP_DIR/node_modules/@metamask/sdk/dist"
    rm -rf "$DAPP_DIR/node_modules/@metamask/sdk/dist"
else
    echo "Directory not found: $DAPP_DIR/node_modules/@metamask/sdk/dist"
fi

echo "Copying new dist folders..."
echo "Copying: $COMM_LAYER_DIR to $DAPP_DIR/node_modules/@metamask/sdk-communication-layer/dist"
cp -rf $COMM_LAYER_DIR "$DAPP_DIR/node_modules/@metamask/sdk-communication-layer/dist"
echo "Copying: $SDK_DIR to $DAPP_DIR/node_modules/@metamask/sdk/dist"
cp -rf $SDK_DIR "$DAPP_DIR/node_modules/@metamask/sdk/dist"

echo "Deleting Vite cache..."
if [ -d "$DAPP_DIR/node_modules/.vite" ]; then
    echo "Deleting: $DAPP_DIR/node_modules/.vite"
    rm -rf "$DAPP_DIR/node_modules/.vite"
else
    echo "Directory not found: $DAPP_DIR/node_modules/.vite"
fi

echo "All done."
