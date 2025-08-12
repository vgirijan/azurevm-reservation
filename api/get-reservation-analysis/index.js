// This file would be located at: /api/get-reservation-analysis/index.js

const { DefaultAzureCredential } = require("@azure/identity");
const { ComputeManagementClient } = require("@azure/arm-compute");
const { ReservationManagementClient } = require("@azure/arm-reservations");

// --- Main Function Logic ---
async function run(context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try {
        // 1. AUTHENTICATION
        const credential = new DefaultAzureCredential();
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

        if (!subscriptionId) {
            throw new Error("AZURE_SUBSCRIPTION_ID is not set in environment variables.");
        }

        const computeClient = new ComputeManagementClient(credential, subscriptionId);
        const reservationClient = new ReservationManagementClient(credential, subscriptionId);

        // 2. DATA FETCHING
        const vmList = [];
        for await (const vm of computeClient.virtualMachines.listAll()) {
            vmList.push(vm);
        }

        const reservationList = [];
        for await (const order of reservationClient.reservationOrder.list()) {
            const reservationOrderId = order.name;
            const reservationsInOrder = await reservationClient.reservation.list(reservationOrderId);
            for await (const reservation of reservationsInOrder) {
                if (reservation.properties.appliedScopes && reservation.properties.appliedScopes.includes(subscriptionId) && reservation.properties.provisioningState === "Succeeded") {
                     reservationList.push(reservation);
                } else if (reservation.properties.appliedScopeType === "Single" && reservation.properties.provisioningState === "Succeeded") {
                    reservationList.push(reservation);
                }
            }
        }
        
        // 3. DATA PROCESSING
        const actualVms = vmList.reduce((acc, vm) => {
            const key = `${vm.hardwareProfile.vmSize}|${vm.location}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const reservedVms = reservationList.reduce((acc, res) => {
            const key = `${res.sku.name}|${res.location}`;
            acc[key] = (acc[key] || 0) + res.properties.quantity;
            return acc;
        }, {});

        const allKeys = [...new Set([...Object.keys(actualVms), ...Object.keys(reservedVms)])];
        
        const analysisData = allKeys.map(key => {
            const [vmSize, location] = key.split('|');
            const actual = actualVms[key] || 0;
            const reserved = reservedVms[key] || 0;
            const gap = actual - reserved;
            const coverage = actual > 0 ? Math.round((reserved / actual) * 100) : (reserved > 0 ? 100 : 0);
            
            let status = 'Needs Investigation';
            if (gap === 0 && actual > 0) status = 'Perfect Match';
            else if (gap > 0) status = 'Under-reserved';
            else if (gap < 0) status = 'Over-reserved';
            else if (actual === 0 && reserved > 0) status = 'Over-reserved';

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
            body: { message: "Error processing request.", details: error.message, stack: error.stack }
        };
    }
}

module.exports = { run };
