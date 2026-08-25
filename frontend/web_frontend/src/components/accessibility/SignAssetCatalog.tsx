import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { SignSequencePlayer } from './SignSequencePlayer';

interface SignAssetDto {
  id: string;
  conceptId: string;
  displayToken: string;
  language: string;
  assetType: string;
  assetReference: string;
  durationMs: number;
  quality: string;
  versionMajor: number;
  versionMinor: number;
  status: 'ACTIVE' | 'IN_REVIEW' | 'DEPRECATED' | 'UNAVAILABLE';
  verificationStatus: 'DRAFT' | 'IN_REVIEW' | 'VERIFIED';
  source: string;
  storagePath: string | null;
}

export const SignAssetCatalog: React.FC = () => {
  const { accessToken } = useAuth();
  const [assets, setAssets] = useState<SignAssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [langFilter, setLangFilter] = useState('ISL');
  const [selectedAsset, setSelectedAsset] = useState<SignAssetDto | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/api/isl/assets', 'GET', null, accessToken);
        setAssets(data || []);
      } catch (err) {
        console.error('Failed to load assets:', err);
        setError('Failed to fetch asset catalog.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [accessToken]);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.conceptId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;
    const matchesLang = langFilter === 'ALL' || asset.language === langFilter;
    return matchesSearch && matchesStatus && matchesLang;
  });

  // Wrap selected asset in a sequence structure for preview
  const previewSequence = selectedAsset ? {
    sequenceId: 'preview-' + selectedAsset.id,
    sourceSessionId: 'preview',
    sourceText: selectedAsset.conceptId,
    language: selectedAsset.language,
    createdAt: Date.now(),
    steps: [{
      sequenceIndex: 0,
      conceptId: selectedAsset.conceptId,
      displayToken: selectedAsset.displayToken,
      durationMs: selectedAsset.durationMs,
      confidence: 1.0,
      asset: {
        assetId: selectedAsset.id,
        conceptId: selectedAsset.conceptId,
        language: selectedAsset.language,
        assetType: selectedAsset.assetType,
        assetReference: selectedAsset.assetReference,
        durationMs: selectedAsset.durationMs,
        version: selectedAsset.versionMajor + '.' + selectedAsset.versionMinor,
        status: selectedAsset.status,
        source: selectedAsset.source
      },
      resolutionStatus: (selectedAsset.storagePath ? 'FOUND' : 'MISSING') as any,
      sourceConcept: 'catalog'
    }],
    totalDurationMs: selectedAsset.durationMs,
    overallConfidence: 1.0,
    status: 'RESOLVED'
  } : null;

  return (
    <div className="w-full flex flex-col gap-6 p-6 bg-bg text-text">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1A237E]">ISL Asset Catalog</h1>
        <p className="text-sm opacity-80 mt-1">
          Review, trace, and preview secure sign language assets stored in PostgreSQL and Supabase.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-cardBg border border-border rounded-lg shadow-sm">
        <div className="flex flex-col gap-1.5 flex-grow">
          <label htmlFor="search" className="text-xs font-bold uppercase opacity-80">Search concept</label>
          <input
            id="search"
            type="text"
            placeholder="e.g. HELLO"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5 w-40">
          <label htmlFor="status" className="text-xs font-bold uppercase opacity-80">Status</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none"
          >
            <option value="ALL">All States</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="DEPRECATED">DEPRECATED</option>
            <option value="UNAVAILABLE">UNAVAILABLE</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 w-40">
          <label htmlFor="lang" className="text-xs font-bold uppercase opacity-80">Language</label>
          <select
            id="lang"
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none"
          >
            <option value="ALL">All Languages</option>
            <option value="ISL">ISL</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table List View */}
        <div className="flex-grow bg-cardBg border border-border rounded-lg overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm opacity-80">Loading asset registry catalog...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-sm opacity-80">No assets match the search criteria.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-sidebar-bg)] border-b border-border text-xs font-bold uppercase">
                  <th className="px-6 py-4">Concept</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`border-b border-border hover:bg-[var(--color-sidebar-bg)] cursor-pointer transition-colors ${
                      selectedAsset?.id === asset.id ? 'bg-[var(--color-sidebar-bg)]' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-[#1A237E]">{asset.conceptId}</td>
                    <td className="px-6 py-4">{asset.assetType}</td>
                    <td className="px-6 py-4">{asset.versionMajor}.{asset.versionMinor}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        asset.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
                          : asset.status === 'IN_REVIEW' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Details and Preview View Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4 p-6 bg-cardBg border border-border rounded-lg shadow-sm">
          <h2 className="text-md font-extrabold text-[#1A237E] border-b border-border pb-2 uppercase">Selected Asset</h2>
          
          {selectedAsset ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold opacity-60 uppercase">Concept</span>
                <span className="text-lg font-black text-[#1A237E]">{selectedAsset.conceptId}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold opacity-60 uppercase">Type</span>
                  <span className="text-sm font-semibold">{selectedAsset.assetType}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold opacity-60 uppercase">Version</span>
                  <span className="text-sm font-semibold">{selectedAsset.versionMajor}.{selectedAsset.versionMinor}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold opacity-60 uppercase">Duration</span>
                  <span className="text-sm font-semibold">{(selectedAsset.durationMs / 1000).toFixed(1)} sec</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold opacity-60 uppercase">Status</span>
                  <span className="text-sm font-bold text-yellow-600">{selectedAsset.status}</span>
                </div>
              </div>

              {/* Dynamic Preview Container with SignSequencePlayer */}
              <div className="flex flex-col gap-1.5 pt-4 border-t border-border">
                <span className="text-xs font-bold opacity-60 uppercase">Media Preview</span>
                {previewSequence ? (
                  <SignSequencePlayer sequence={previewSequence} />
                ) : (
                  <div className="w-full aspect-video bg-bg rounded-lg border border-dashed border-border flex items-center justify-center text-xs opacity-60">
                    No media associated with this asset.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs opacity-60">
              Select an asset from the list to view its properties and play previews.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignAssetCatalog;
