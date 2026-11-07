import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  MARKETPLACE_CATEGORIES,
  EXCHANGE_TYPES,
  ITEM_CONDITIONS,
  LISTING_STATUSES,
} from '../../lib/constants';
import {
  PlusCircle,
  Search,
  ArrowRight,
  BookOpen,
  Gift,
  Repeat,
  User,
} from 'lucide-react';

export default function MarketplaceListPage() {
  const { role } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/listings');
      setListings(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch marketplace listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await apiClient.get('/listings');
        if (!ignore) setListings(data || []);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to fetch marketplace listings');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesType = !selectedType || item.exchange_type === selectedType;
    const matchesCondition = !selectedCondition || item.condition === selectedCondition;
    const matchesStatus = !selectedStatus || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesType && matchesCondition && matchesStatus;
  });

  const getExchangeBadge = (item) => {
    if (item.exchange_type === 'Donate') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <Gift className="w-3 h-3" /> Free Donation
        </span>
      );
    }
    if (item.exchange_type === 'Sell') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
          ₹{item.price_inr} (Direct Sale)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <Repeat className="w-3 h-3" /> Barter Swap
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Student Resource Exchange Marketplace"
        description="Encourage circular reuse on campus. Donate, sell, or barter textbooks, drafters, calculators, and lab equipment between verified DYPCOE engineering students."
        action={
          role === 'student' ? (
            <Link to="/marketplace/create">
              <Button variant="primary" icon={PlusCircle}>
                Post Resource Item
              </Button>
            </Link>
          ) : null
        }
      />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, edition, subject, or keywords..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm bg-white text-slate-700"
            >
              <option value="">All Types (Donate/Sell/Barter)</option>
              {Object.values(EXCHANGE_TYPES).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm bg-white text-slate-700"
            >
              <option value="">All Conditions</option>
              {ITEM_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              {Object.values(LISTING_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {(search || selectedCategory || selectedType || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setSelectedType('');
                  setSelectedStatus('');
                }}
                className="text-xs text-rose-600 hover:underline px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading campus marketplace items..." />
      ) : error ? (
        <ErrorState message={error} retry={fetchListings} />
      ) : filteredListings.length === 0 ? (
        <EmptyState
          title="No marketplace listings found"
          description="Be the first to list an academic textbook or tool for junior students."
          action={
            role === 'student' ? (
              <Link to="/marketplace/create">
                <Button variant="primary" icon={PlusCircle}>
                  Post Item Now
                </Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Photo or Placeholder */}
                <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden relative border-b border-slate-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <BookOpen className="w-10 h-10 mb-1" />
                      <span className="text-[11px]">No Photo Provided</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.condition}
                    </span>
                  </div>

                  <Link to={`/marketplace/${item.id}`} className="block">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-campus-700 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </Link>

                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-3">{getExchangeBadge(item)}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 truncate max-w-[140px]">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {item.owner_name}
                </span>

                <Link
                  to={`/marketplace/${item.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-campus-700 hover:text-campus-800"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
