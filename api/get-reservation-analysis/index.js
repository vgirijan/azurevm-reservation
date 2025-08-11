// This file would be located at: /api/get-reservation-analysis/index.js

const { DefaultAzureCredential } = require("@azure/identity");
const { ComputeManagementClient } = require("@azure/arm-compute");
// Corrected the client name to use the plural 'Reservations'
const { ReservationsManagementClient } = require("@azure/arm-reservations");

// --- Main Function Logic ---
async function run(context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try {
        // 1. AUTHENTICATION
        // DefaultAzureCredential will automatically use the managed identity of the
        // Static Web App when deployed. For local development, it will use the
        // credentials you're logged in with in VS Code or Azure CLI.
        const credential = new DefaultAzureCredential();
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

        if (!subscriptionId) {
            throw new Error("AZURE_SUBSCRIPTION_ID is not set in environment variables.");
        }

        const computeClient = new ComputeManagementClient(credential, subscriptionId);
        // Corrected the instantiation to use the plural 'ReservationsManagementClient'
        const reservationClient = new ReservationsManagementClient(credential, subscriptionId);

        // 2. DATA FETCHING
        // Get all virtual machines in the subscription
        const vmList = [];
        for await (const vm of computeClient.virtualMachines.listAll()) {
            vmList.push(vm);
        }

        // Get all reservation orders and their reservations
        const reservationList = [];
        for await (const order of reservationClient.reservationOrder.list()) {
            const reservationsInOrder = await reservationClient.reservation.list(order.id.split('/')[4]);
            for await (const reservation of reservationsInOrder) {
                 // We only care about active VM reservations
                if (reservation.properties.appliedScopeType !== "Shared" && reservation.properties.provisioningState === "Succeeded") {
                     reservationList.push(reservation);
                }
            }
        }
        
        // 3. DATA PROCESSING
        // Group running VMs by size and location
        const actualVms = vmList.reduce((acc, vm) => {
            const key = `${vm.hardwareProfile.vmSize}|${vm.location}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        // Group reservations by size and location
        const reservedVms = reservationList.reduce((acc, res) => {
            const key = `${res.properties.reservedResourceType}|${res.properties.location}`;
            acc[key] = (acc[key] || 0) + res.properties.quantity;
            return acc;
        }, {});

        // Combine the data into the final report format
        const allKeys = [...new Set([...Object.keys(actualVms), ...Object.keys(reservedVms)])];
        
        const analysisData = allKeys.map(key => {
            const [vmSize, location] = key.split('|');
            const actual = actualVms[key] || 0;
            const reserved = reservedVms[key] || 0;
            const gap = actual - reserved;
            const coverage = actual > 0 ? Math.round((reserved / actual) * 100) : (reserved > 0 ? 100 : 0);
            
            let status = 'Needs Investigation';
            if (coverage === 100 && gap === 0) status = 'Perfect Match';
            else if (coverage < 100) status = 'Under-reserved';
            else if (coverage > 100) status = 'Over-reserved';

            return { vmSize, location, actual, reserved, gap, coverage, status };
        });


        // 4. RETURN RESPONSE
        context.res = {
            status: 200,
            body: analysisData,
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        context.log.error(error);
        context.res = {
            status: 500,
            body: { message: "Error processing request.", details: error.message }
        };
    }
}

module.exports = { run };
