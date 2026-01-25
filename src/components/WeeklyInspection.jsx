import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Eye, Trash2, Edit, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, X } from 'lucide-react';
import {
  createWeeklyInspection,
  fetchWeeklyInspections,
  fetchWeeklyInspectionById,
  updateWeeklyInspection,
  deleteWeeklyInspection
} from './services/weeklyInspectionService';
import { fetchCows } from './services/cowService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const WeeklyInspection = () => {
  const [activeView, setActiveView] = useState('list'); // list, create, view, edit
  const [inspections, setInspections] = useState([]);
  const [cows, setCows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    cowId: '',
    weekStartDate: '',
    // Health inspection fields
    bodyConditionScore: '',
    feedIntake: '',
    waterIntake: '',
    udderHealth: '',
    hoofLegCondition: '',
    heatObserved: '',
    healthIssues: '',
    treatmentGiven: '',
    dewormingDueDate: '',
    vaccinationDue: '',
    remarks: '',
    inspectorName: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [inspectionsData, cowsData] = await Promise.all([
        fetchWeeklyInspections(),
        fetchCows()
      ]);
      console.log('Loaded cows data:', cowsData);
      console.log('Number of cows:', cowsData?.length);
      // Filter out sold cows
      const activeCows = cowsData.filter(cow => cow.status !== 'Sold');
      console.log('Active cows (excluding sold):', activeCows.length);
      setInspections(inspectionsData);
      setCows(activeCows);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      cowId: '',
      weekStartDate: '',
      bodyConditionScore: '',
      feedIntake: '',
      waterIntake: '',
      udderHealth: '',
      hoofLegCondition: '',
      heatObserved: '',
      healthIssues: '',
      treatmentGiven: '',
      dewormingDueDate: '',
      vaccinationDue: '',
      remarks: '',
      inspectorName: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cowId || !formData.weekStartDate) {
      toast.error('Please select a cow and week start date');
      return;
    }

    try {
      if (activeView === 'edit' && selectedInspection) {
        await updateWeeklyInspection(selectedInspection.id, formData);
        toast.success('Weekly inspection updated successfully');
      } else {
        await createWeeklyInspection(formData);
        toast.success('Weekly inspection created successfully');
      }

      await loadData();
      resetForm();
      setActiveView('list');
    } catch (error) {
      toast.error('Failed to save weekly inspection');
      console.error(error);
    }
  };

  const handleView = async (inspection) => {
    setSelectedInspection(inspection);
    setActiveView('view');
  };

  const handleEdit = async (inspection) => {
    setSelectedInspection(inspection);
    setFormData(inspection);
    setActiveView('edit');
  };

  const handleDelete = async (inspectionId) => {
    if (window.confirm('Are you sure you want to delete this inspection?')) {
      try {
        await deleteWeeklyInspection(inspectionId);
        toast.success('Inspection deleted successfully');
        await loadData();
      } catch (error) {
        toast.error('Failed to delete inspection');
        console.error(error);
      }
    }
  };

  const getCowDetails = (cowId) => {
    return cows.find(cow => cow.id === cowId) || {};
  };

  // Filter and pagination
  const filteredInspections = inspections.filter(inspection => {
    const cow = getCowDetails(inspection.cowId);
    const searchLower = searchQuery.toLowerCase();
    const tagNumber = cow.tagNumber || cow.tag_number || '';
    return (
      cow.name?.toLowerCase().includes(searchLower) ||
      tagNumber.toLowerCase().includes(searchLower) ||
      inspection.weekStartDate?.includes(searchQuery)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInspections = filteredInspections.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Render form (create/edit)
  const renderForm = () => {
    const selectedCow = formData.cowId ? getCowDetails(formData.cowId) : null;

    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeView === 'edit' ? 'Edit' : 'Create'} Weekly Inspection
            </h2>
            <button
              onClick={() => {
                resetForm();
                setActiveView('list');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
              <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
                INDIVIDUAL COW – WEEKLY RECORD & HEALTH INSPECTION
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Cow ID / Name</label>
                  <select
                    value={formData.cowId}
                    onChange={(e) => handleInputChange('cowId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Cow ({cows.length} available)</option>
                    {cows.map(cow => {
                      console.log('Rendering cow option:', cow);
                      return (
                        <option key={cow.id} value={cow.id}>
                          {cow.tagNumber || cow.tag_number} - {cow.name}
                        </option>
                      );
                    })}
                  </select>
                  {selectedCow && (
                    <div className="mt-1 text-sm text-gray-600">
                      Breed: {selectedCow.breed}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Age (Years)</label>
                  <input
                    type="text"
                    value={selectedCow?.age || 'N/A'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Week Start Date</label>
                  <input
                    type="date"
                    value={formData.weekStartDate}
                    onChange={(e) => handleInputChange('weekStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Health Inspection Fields */}
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <h4 className="bg-green-50 px-4 py-3 font-semibold text-gray-800 border-b-2 border-gray-300">
                Health Inspection
              </h4>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Body Condition Score (1–5)</label>
                    <select
                      value={formData.bodyConditionScore}
                      onChange={(e) => handleInputChange('bodyConditionScore', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Score</option>
                      <option value="1">1 - Very Thin</option>
                      <option value="2">2 - Thin</option>
                      <option value="3">3 - Moderate</option>
                      <option value="4">4 - Good</option>
                      <option value="5">5 - Excellent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Feed Intake</label>
                    <select
                      value={formData.feedIntake}
                      onChange={(e) => handleInputChange('feedIntake', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Water Intake</label>
                    <select
                      value={formData.waterIntake}
                      onChange={(e) => handleInputChange('waterIntake', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      <option value="Normal">Normal</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Udder Health</label>
                    <select
                      value={formData.udderHealth}
                      onChange={(e) => handleInputChange('udderHealth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      <option value="Normal">Normal</option>
                      <option value="Mastitis">Mastitis</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Hoof / Leg Condition</label>
                    <input
                      type="text"
                      value={formData.hoofLegCondition}
                      onChange={(e) => handleInputChange('hoofLegCondition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Normal, Lame, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Heat Observed</label>
                    <select
                      value={formData.heatObserved}
                      onChange={(e) => handleInputChange('heatObserved', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Deworming Due Date</label>
                    <input
                      type="date"
                      value={formData.dewormingDueDate}
                      onChange={(e) => handleInputChange('dewormingDueDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Vaccination Due</label>
                    <input
                      type="text"
                      value={formData.vaccinationDue}
                      onChange={(e) => handleInputChange('vaccinationDue', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., FMD, Brucellosis, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Health Issues / Symptoms</label>
                  <textarea
                    value={formData.healthIssues}
                    onChange={(e) => handleInputChange('healthIssues', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Describe any health issues or symptoms observed..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Treatment Given</label>
                  <textarea
                    value={formData.treatmentGiven}
                    onChange={(e) => handleInputChange('treatmentGiven', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Describe any treatment administered..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="2"
                    placeholder="Any additional remarks..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Inspector Name</label>
                  <input
                    type="text"
                    value={formData.inspectorName}
                    onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter inspector name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveView('list');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {activeView === 'edit' ? 'Update' : 'Create'} Inspection
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render view mode
  const renderView = () => {
    if (!selectedInspection) return null;

    const cow = getCowDetails(selectedInspection.cowId);

    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Weekly Inspection Details</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(selectedInspection)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Edit"
              >
                <Edit size={20} />
              </button>
              <button
                onClick={() => setActiveView('list')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Header Information - View Mode */}
          <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50 mb-6">
            <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
              INDIVIDUAL COW – WEEKLY RECORD & HEALTH INSPECTION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="text-sm font-semibold text-gray-600">Cow ID / Name</div>
                <div className="text-base font-medium">{cow.tagNumber || cow.tag_number} - {cow.name}</div>
                <div className="text-sm text-gray-600">Breed: {cow.breed}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600">Age (Years)</div>
                <div className="text-base font-medium">{cow.age || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600">Week Start Date</div>
                <div className="text-base font-medium">{new Date(selectedInspection.weekStartDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Health Inspection Fields - View Mode */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <h4 className="bg-green-50 px-4 py-3 font-semibold text-gray-800 border-b-2 border-gray-300">
              Health Inspection
            </h4>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-600">Body Condition Score</div>
                  <div className="text-base">{selectedInspection.bodyConditionScore || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Feed Intake</div>
                  <div className="text-base">{selectedInspection.feedIntake || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Water Intake</div>
                  <div className="text-base">{selectedInspection.waterIntake || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Udder Health</div>
                  <div className="text-base">{selectedInspection.udderHealth || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Hoof / Leg Condition</div>
                  <div className="text-base">{selectedInspection.hoofLegCondition || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Heat Observed</div>
                  <div className="text-base">{selectedInspection.heatObserved || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Deworming Due Date</div>
                  <div className="text-base">
                    {selectedInspection.dewormingDueDate ? new Date(selectedInspection.dewormingDueDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Vaccination Due</div>
                  <div className="text-base">{selectedInspection.vaccinationDue || 'N/A'}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600">Health Issues / Symptoms</div>
                <div className="text-base mt-1">{selectedInspection.healthIssues || 'None reported'}</div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600">Treatment Given</div>
                <div className="text-base mt-1">{selectedInspection.treatmentGiven || 'None'}</div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600">Remarks</div>
                <div className="text-base mt-1">{selectedInspection.remarks || 'No remarks'}</div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600">Inspector Name</div>
                <div className="text-base mt-1">{selectedInspection.inspectorName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render list view
  const renderList = () => {
    return (
      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Weekly Inspections</h2>
            <p className="text-gray-600 mt-1">Manage weekly health inspections and milk production records</p>
          </div>
          <button
            onClick={() => setActiveView('create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Inspection
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by cow name, tag number, or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cow Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentInspections.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No inspections found. Create your first weekly inspection!
                    </td>
                  </tr>
                ) : (
                  currentInspections.map((inspection) => {
                    const cow = getCowDetails(inspection.cowId);
                    const hasHealthIssues = inspection.healthIssues && inspection.healthIssues.trim() !== '';

                    return (
                      <tr key={inspection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{cow.tagNumber || cow.tag_number}</div>
                          <div className="text-sm text-gray-500">{cow.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(inspection.weekStartDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {hasHealthIssues ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle size={14} />
                              Issues Reported
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={14} />
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {inspection.inspectorName}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleView(inspection)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(inspection)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(inspection.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInspections.length)} of{' '}
                {filteredInspections.length} inspections
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="px-4 py-1 text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {activeView === 'list' && renderList()}
      {(activeView === 'create' || activeView === 'edit') && renderForm()}
      {activeView === 'view' && renderView()}
    </div>
  );
};

export default WeeklyInspection;
