import React, { useState, useEffect } from 'react';

// --- Helper Components ---

const SummaryCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className={`text-3xl p-4 rounded-full mr-4 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  const statusStyles = {
    'Perfect Match': 'bg-green-100 text-green-800',
    'Under-reserved': 'bg-red-100 text-red-800',
    'Over-reserved': 'bg-yellow-100 text-yellow-800',
    'Needs Investigation': 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

// --- Main Application ---

const App = () => {
    // State to hold our data, loading status, and any errors
    const [analysisData, setAnalysisData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const subscription = 'jonas-enterprise'; // Example subscription

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                // The relative URL '/api/get-reservation-analysis' fails in environments
                // without a proxy. Simulating the fetch with mock data for now.
                // When deployed to Azure Static Web Apps, the real fetch will work.
                // const response = await fetch('/api/get-reservation-analysis');
                // if (!response.ok) {
                //     throw new Error(`HTTP error! status: ${response.status}`);
                // }
                // const data = await response.json();
                // setAnalysisData(data);

                // --- Start Mock Data Simulation ---
                const mockData = [
                    { vmSize: 'Standard_D16s_v3', location: 'Canada Central', actual: 10, reserved: 11, gap: -1, coverage: 110, status: 'Over-reserved' },
                    { vmSize: 'Standard_D8s_v3', location: 'Canada Central', actual: 10, reserved: 9, gap: 1, coverage: 90, status: 'Under-reserved' },
                    { vmSize: 'Standard_D4s_v3', location: 'Canada Central', actual: 20, reserved: 18, gap: 2, coverage: 90, status: 'Under-reserved' },
                    { vmSize: 'Standard_D2s_v3', location: 'Canada Central', actual: 5, reserved: 5, gap: 0, coverage: 100, status: 'Perfect Match' },
                    { vmSize: 'Standard_L32s_v3', location: 'Canada Central', actual: 1, reserved: 1, gap: 0, coverage: 100, status: 'Perfect Match' },
                    { vmSize: 'Standard_D16s_v4', location: 'US Central', actual: 32, reserved: 32, gap: 0, coverage: 100, status: 'Perfect Match' },
                ];
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
                setAnalysisData(mockData);
                // --- End Mock Data Simulation ---


            } catch (e) {
                setError(e.message);
                console.error("Failed to fetch analysis data:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []); // The empty dependency array ensures this effect runs only once on mount

    // --- Loading and Error UI ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-700">Loading Reservation Analysis...</p>
                    <p className="text-gray-500">Connecting to Azure...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center bg-red-100 p-8 rounded-lg shadow-md">
                    <p className="text-xl font-semibold text-red-700">Failed to load data</p>
                    <p className="text-red-600">Error: {error}</p>
                </div>
            </div>
        );
    }

    // --- Calculations (now done only after data is loaded) ---
    const totalVMs = analysisData.reduce((sum, row) => sum + row.actual, 0);
    const totalReserved = analysisData.reduce((sum, row) => sum + row.reserved, 0);
    const overallCoverage = totalVMs > 0 ? ((totalReserved / totalVMs) * 100).toFixed(1) : 0;
    const perfectMatches = analysisData.filter(row => row.status === 'Perfect Match').length;
    const totalInstanceTypes = analysisData.length;
    const underReserved = analysisData.filter(row => row.gap > 0);
    const overReserved = analysisData.filter(row => row.gap < 0);

    // --- Render the main dashboard ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Azure VM vs Reserved Analysis Report</h1>
                    <p className="text-gray-500">Generated on {new Date().toLocaleDateString()} for subscription: {subscription}</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <SummaryCard title="Total VMs" value={totalVMs} icon="💻" color="bg-blue-100 text-blue-600" />
                    <SummaryCard title="Total Reserved" value={totalReserved} icon="📄" color="bg-green-100 text-green-600" />
                    <SummaryCard title="Overall Coverage" value={`${overallCoverage}%`} icon="📈" color="bg-purple-100 text-purple-600" />
                    <SummaryCard title="Perfect Matches" value={`${perfectMatches}/${totalInstanceTypes}`} icon="✅" color="bg-teal-100 text-teal-600" />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Gap Analysis by VM Size and Region</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">VM Size</th>
                                    <th scope="col" className="px-6 py-3">Region</th>
                                    <th scope="col" className="px-6 py-3 text-center">Actual VMs</th>
                                    <th scope="col" className="px-6 py-3 text-center">Reserved</th>
                                    <th scope="col" className="px-6 py-3 text-center">Gap</th>
                                    <th scope="col" className="px-6 py-3 text-center">Coverage %</th>
                                    <th scope="col" className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysisData.map((row, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{row.vmSize}</td>
                                        <td className="px-6 py-4">{row.location}</td>
                                        <td className="px-6 py-4 text-center">{row.actual}</td>
                                        <td className="px-6 py-4 text-center">{row.reserved}</td>
                                        <td className={`px-6 py-4 text-center font-bold ${row.gap > 0 ? 'text-red-500' : row.gap < 0 ? 'text-yellow-500' : 'text-green-500'}`}>{row.gap}</td>
                                        <td className={`px-6 py-4 text-center font-semibold ${row.coverage < 95 ? 'text-red-500' : row.coverage > 100 ? 'text-yellow-500' : 'text-green-500'}`}>{row.coverage}%</td>
                                        <td className="px-6 py-4 text-center"><StatusPill status={row.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Comprehensive Analysis & Recommendations</h2>
                    <div className="space-y-4">
                        {underReserved.length > 0 && <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                            <h3 className="font-bold text-red-800">Under-reserved Instances</h3>
                            <p className="text-sm text-red-700 mb-2">Action Required: The following VM types need additional reservations.</p>
                            <ul className="list-disc list-inside text-sm text-red-700">
                                {underReserved.map((item, i) => <li key={i}><strong>{item.vmSize}</strong> in <strong>{item.location}</strong>: Need {item.gap} more reservation(s). Currently {item.coverage}% coverage.</li>)}
                            </ul>
                        </div>}
                        {overReserved.length > 0 && <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <h3 className="font-bold text-yellow-800">Over-reserved Instances (Cost Optimization)</h3>
                            <p className="text-sm text-yellow-700 mb-2">Opportunity: Review these for potential cost savings.</p>
                            <ul className="list-disc list-inside text-sm text-yellow-700">
                                {overReserved.map((item, i) => <li key={i}><strong>{item.vmSize}</strong> in <strong>{item.location}</strong>: {Math.abs(item.gap)} excess reservation(s). ({item.coverage}% coverage)</li>)}
                            </ul>
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
