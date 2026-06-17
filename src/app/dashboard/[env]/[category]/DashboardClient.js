"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardClient({ env, category, operatorName, isAdmin, defaultUnraidUrl, defaultUnraidKey }) {
  const router = useRouter();

  // Core Data State
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState({
    storage: { used: 8.4, total: 16.0, percent: 52 },
    cpu: 12,
    ram: 34
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Settings Modal (Dev Panel) States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [unraidApiUrl, setUnraidApiUrl] = useState(defaultUnraidUrl || 'http://192.168.1.50:8899/api/unraid');
  const [unraidApiKey, setUnraidApiKey] = useState(defaultUnraidKey || 'unraid_secret_token_2026_xyz');
  const [mockMetrics, setMockMetrics] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [apiLogs, setApiLogs] = useState([
    '[SYSTEM] Unraid API control daemon v1.4.2 started.',
    '[SYSTEM] Listening on interface br0 (192.168.1.50).',
    '[OK] Connection to Unraid Array initialized.'
  ]);

  // Share States
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [generatingShare, setGeneratingShare] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareTokensList, setShareTokensList] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [durationDays, setDurationDays] = useState('3');
  const [activeToken, setActiveToken] = useState(null);
  const [loadingActiveToken, setLoadingActiveToken] = useState(false);

  // Toast & Copy Confirmation States
  const [toastMessage, setToastMessage] = useState('');
  const [copiedTokenId, setCopiedTokenId] = useState(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const toastTimeoutRef = useRef(null);

  // Category States
  const [categories, setCategories] = useState([]);
  const [collectionsExpanded, setCollectionsExpanded] = useState(true);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('👮');
  const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number, type: string, data: object }
  const [expandedCategories, setExpandedCategories] = useState({});

  // Subfolder (Mappen) States
  const [subfolders, setSubfolders] = useState([]);
  const [allSubfolders, setAllSubfolders] = useState([]);
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [showAddSubfolderForm, setShowAddSubfolderForm] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');

  // Account Settings & User Management States
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountTab, setAccountTab] = useState('password'); // 'password' or 'users'
  
  // Password Change Fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // User Management Admin Fields
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Admin Edit User Fields
  const [editUserId, setEditUserId] = useState(null);
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserAvatarFile, setEditUserAvatarFile] = useState(null);
  const [editUserAvatarPreview, setEditUserAvatarPreview] = useState('');
  const [editUserSuccessMessage, setEditUserSuccessMessage] = useState('');

  // Profile Update Fields
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Custom Dialog Modal States
  const [customModal, setCustomModal] = useState(null); // { type, title, message, defaultValue, resolve, isDestructive }

  const showAlert = (title, message) => {
    return new Promise((resolve) => {
      setCustomModal({ type: 'alert', title, message, resolve });
    });
  };

  const showConfirm = (title, message, isDestructive = false) => {
    return new Promise((resolve) => {
      setCustomModal({ type: 'confirm', title, message, resolve, isDestructive });
    });
  };

  const showPrompt = (title, message, defaultValue = '') => {
    return new Promise((resolve) => {
      setCustomModal({ type: 'prompt', title, message, defaultValue, resolve });
    });
  };

  const showCategoryForm = (title, defaultName = '', defaultEmoji = '📁') => {
    return new Promise((resolve) => {
      setCustomModal({ 
        type: 'categoryForm', 
        title, 
        defaultValue: { name: defaultName, emoji: defaultEmoji }, 
        resolve 
      });
    });
  };

  // Dialog Local Input States
  const [dialogInput, setDialogInput] = useState('');
  const [dialogCategoryName, setDialogCategoryName] = useState('');
  const [dialogCategoryEmoji, setDialogCategoryEmoji] = useState('');

  useEffect(() => {
    if (customModal) {
      if (customModal.type === 'prompt') {
        setDialogInput(customModal.defaultValue || '');
      } else if (customModal.type === 'categoryForm') {
        setDialogCategoryName(customModal.defaultValue?.name || '');
        setDialogCategoryEmoji(customModal.defaultValue?.emoji || '📁');
      }
    }
  }, [customModal]);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUrl = localStorage.getItem('unraid_api_url');
        const storedKey = localStorage.getItem('unraid_api_key');
        const storedMock = localStorage.getItem('mock_metrics');
        
        if (storedUrl) setUnraidApiUrl(storedUrl);
        else if (defaultUnraidUrl) setUnraidApiUrl(defaultUnraidUrl);

        if (storedKey) setUnraidApiKey(storedKey);
        else if (defaultUnraidKey) setUnraidApiKey(defaultUnraidKey);

        if (storedMock !== null) {
          setMockMetrics(storedMock === 'true');
        }
      } catch (e) {
        console.warn('Failed to access localStorage:', e);
      }
    }
  }, [defaultUnraidUrl, defaultUnraidKey]);

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Handle document click to close context menu
  useEffect(() => {
    const handleDocumentClick = () => {
      setContextMenu(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleCopy = (text, tokenId = null) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (tokenId) {
        setCopiedTokenId(tokenId);
        setTimeout(() => setCopiedTokenId(null), 2000);
      } else {
        setCopiedShareLink(true);
        setTimeout(() => setCopiedShareLink(false), 2000);
      }
      showToast('Deellink gekopieerd naar klembord!');
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, emoji: newCategoryEmoji })
      });
      if (res.ok) {
        setNewCategoryName('');
        setShowAddCategoryForm(false);
        fetchCategories();
        showToast('Categorie succesvol toegevoegd!');
      } else {
        const data = await res.json();
        await showAlert('Fout', data.error || 'Kon categorie niet toevoegen');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openContextMenu = (e, type, data) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 200;
    let menuHeight = 150;
    if (type === 'photo') {
      menuHeight = 220;
    } else if (type === 'category') {
      menuHeight = 165;
    } else if (type === 'blank') {
      menuHeight = 100;
    }
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setContextMenu({ x, y, type, data });
  };

  const handleGridContextMenu = (e) => {
    if (e.target.closest('.photo-card') || e.target.closest('.sidebar') || e.target.closest('.modal-content') || e.target.closest('.context-menu') || e.target.closest('.timeline-group-header') || e.target.closest('.timeline-group-date')) {
      return;
    }
    e.preventDefault();
    openContextMenu(e, 'grid-blank', {});
  };

  const handleSidebarContextMenu = (e) => {
    if (e.target.closest('.sidebar-folder-node') || e.target.closest('.sidebar-item') || e.target.closest('.sidebar-brand') || e.target.closest('.stat-item') || e.target.closest('.context-menu') || e.target.closest('.sidebar-add-category-form') || e.target.closest('.btn-sidebar-add-dashed')) {
      return;
    }
    e.preventDefault();
    openContextMenu(e, 'sidebar-blank', {});
  };

  const toggleCategoryExpand = (catName, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setApiLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Save settings to localStorage helpers
  const saveUrl = (val) => {
    setUnraidApiUrl(val);
    try {
      localStorage.setItem('unraid_api_url', val);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };
  const saveKey = (val) => {
    setUnraidApiKey(val);
    try {
      localStorage.setItem('unraid_api_key', val);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };
  const saveMockMetrics = (val) => {
    setMockMetrics(val);
    try {
      localStorage.setItem('mock_metrics', String(val));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    addLog(`[CONNECT] Testing connection to ${unraidApiUrl}...`);
    try {
      const params = new URLSearchParams();
      if (unraidApiUrl) params.append('url', unraidApiUrl);
      if (unraidApiKey) params.append('key', unraidApiKey);

      const res = await fetch(`/api/stats?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTestingConnection(false);
        addLog(`[OK] Response 200 from host. Unraid daemon responsive.`);
        addLog(`[INFO] Array disks reported operational. Used: ${data.storage?.used} TB / Total: ${data.storage?.total} TB`);
      } else {
        setTestingConnection(false);
        addLog(`[ERROR] Connection failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setTestingConnection(false);
      addLog(`[ERROR] Failed to fetch stats: ${err.message}`);
    }
  };

  const handleClearLogs = () => {
    setApiLogs([`[SYSTEM] Logs cleared.`]);
  };

  const fetchShareTokens = useCallback(async () => {
    try {
      setLoadingTokens(true);
      const res = await fetch('/api/share/list');
      if (res.ok) {
        const data = await res.json();
        setShareTokensList(data.tokens || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  const fetchActiveShareToken = async (photoId) => {
    setLoadingActiveToken(true);
    setShareError('');
    setShareLink('');
    setActiveToken(null);
    try {
      const res = await fetch(`/api/share/active?photoId=${photoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.activeToken) {
          setActiveToken(data.activeToken);
          const absoluteLink = window.location.origin + '/share/' + data.activeToken.token;
          setShareLink(absoluteLink);
        }
      }
    } catch (err) {
      console.error('Fetch active token error:', err);
    } finally {
      setLoadingActiveToken(false);
    }
  };

  const handleGenerateShare = async (photoId, days = 3) => {
    setGeneratingShare(true);
    setShareError('');
    setShareLink('');
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, durationDays: days })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Genereren mislukt');
      }
      const absoluteLink = window.location.origin + '/share/' + data.token;
      setShareLink(absoluteLink);
      setActiveToken({
        id: data.id,
        token: data.token,
        expires_at: data.expires_at
      });
      await fetchActiveShareToken(photoId);
      if (isAdmin) {
        fetchShareTokens();
      }
    } catch (err) {
      setShareError(err.message || 'Kon deellink niet genereren.');
    } finally {
      setGeneratingShare(false);
    }
  };

  const handleRevokeActiveToken = async (tokenId, photoId) => {
    setGeneratingShare(true);
    setShareError('');
    try {
      const res = await fetch('/api/share/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tokenId, action: 'revoke' })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Annuleren mislukt');
      }
      setActiveToken(null);
      setShareLink('');
      if (isAdmin) {
        fetchShareTokens();
      }
    } catch (err) {
      setShareError(err.message || 'Kon link niet annuleren.');
    } finally {
      setGeneratingShare(false);
    }
  };

  const handleManageShare = async (tokenId, action) => {
    try {
      const res = await fetch('/api/share/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tokenId, action })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Actie mislukt');
      }
      // Reload token list
      fetchShareTokens();
      addLog(`[ACTION] Share token ID ${tokenId} manage action: ${action.toUpperCase()}`);
    } catch (err) {
      await showAlert('Fout', err.message);
    }
  };

  // Photo Edit Form State
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEnv, setEditEnv] = useState('irl');
  const [editCategory, setEditCategory] = useState('politie');
  const [editSubfolder, setEditSubfolder] = useState('none');
  const [newEditSubfolderName, setNewEditSubfolderName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDateTaken, setEditDateTaken] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadLocation, setUploadLocation] = useState('');
  const [uploadDateTaken, setUploadDateTaken] = useState('Vandaag');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState(category);
  const [uploadEnv, setUploadEnv] = useState(env);
  const [uploadSubfolder, setUploadSubfolder] = useState('none');
  const [newUploadSubfolderName, setNewUploadSubfolderName] = useState('');
  
  // Drag & Drop State
  const [uploadFiles, setUploadFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  
  const fileInputRef = useRef(null);

  // Sync category on change
  useEffect(() => {
    setCurrentSubfolder(null);
    setShowAddSubfolderForm(false);
    setNewSubfolderName('');

    const isSpecial = category === 'photos' || category === 'videos';
    const isValidCategory = categories.some(cat => cat.name === category);
    
    if (isSpecial || !isValidCategory) {
      if (categories.length > 0) {
        setUploadCategory(categories[0].name);
      } else {
        setUploadCategory('politie');
      }
    } else {
      setUploadCategory(category);
    }
    setUploadEnv(env);
  }, [category, env, categories]);

  // Data Fetching
  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/photos?env=${env}&category=all`);
      if (!res.ok) throw new Error('Ophalen mislukt');
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [env]);

  const fetchSubfolders = useCallback(async () => {
    if (category === 'photos' || category === 'videos') {
      setSubfolders([]);
    } else {
      try {
        const res = await fetch(`/api/subfolders?env=${env}&category=${category}`);
        if (res.ok) {
          const data = await res.json();
          setSubfolders(data.subfolders || []);
        }
      } catch (err) {
        console.error('Fetch subfolders error:', err);
      }
    }

    try {
      const res = await fetch(`/api/subfolders?env=${env}&category=all`);
      if (res.ok) {
        const data = await res.json();
        setAllSubfolders(data.subfolders || []);
      }
    } catch (err) {
      console.error('Fetch all subfolders error:', err);
    }
  }, [env, category]);

  const handleAddSubfolder = async (e) => {
    e.preventDefault();
    if (!newSubfolderName || !newSubfolderName.trim()) return;
    try {
      const res = await fetch('/api/subfolders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, name: newSubfolderName.trim(), env })
      });
      if (res.ok) {
        setNewSubfolderName('');
        setShowAddSubfolderForm(false);
        fetchSubfolders();
        showToast('Map succesvol toegevoegd!');
      } else {
        const data = await res.json();
        await showAlert('Fout', data.error || 'Kon map niet toevoegen');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubfolder = async (folderName, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!await showConfirm('Map verwijderen', `Weet je zeker dat je de map "${folderName}" wilt verwijderen? Voertuigen in deze map worden niet verwijderd maar verplaatst naar de hoofdmap.`, true)) {
      return;
    }
    try {
      const res = await fetch(`/api/subfolders?env=${env}&category=${category}&name=${encodeURIComponent(folderName)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchSubfolders();
        fetchPhotos();
        showToast('Map succesvol verwijderd!');
      } else {
        const data = await res.json();
        await showAlert('Fout', data.error || 'Kon map niet verwijderen');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('unraid_api_url') || unraidApiUrl : unraidApiUrl;
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem('unraid_api_key') || unraidApiKey : unraidApiKey;
      const storedMock = typeof window !== 'undefined' ? localStorage.getItem('mock_metrics') || String(mockMetrics) : String(mockMetrics);

      const queryParams = new URLSearchParams();
      if (storedUrl) queryParams.append('url', storedUrl);
      if (storedKey) queryParams.append('key', storedKey);
      queryParams.append('mock', storedMock);

      const res = await fetch(`/api/stats?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [unraidApiUrl, unraidApiKey, mockMetrics]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        const selfUser = data.users?.find(u => u.username === operatorName);
        if (selfUser) {
          setProfileName(selfUser.name || '');
          setProfileEmail(selfUser.email || '');
          setProfileAvatar(selfUser.avatar_path || '');
        }
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [operatorName]);

  useEffect(() => {
    fetchCategories();
    fetchPhotos();
    fetchSubfolders();
    fetchStats();
    fetchShareTokens();
    fetchUsers();
    // Refresh stats and tokens list every 10 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchShareTokens();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchCategories, fetchPhotos, fetchSubfolders, fetchStats, fetchShareTokens, fetchUsers]);

  useEffect(() => {
    if (showAccountModal) {
      fetchUsers();
    }
  }, [showAccountModal, fetchUsers]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Nieuwe wachtwoorden komen niet overeen.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: operatorName,
          oldPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Wachtwoord succesvol gewijzigd!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Kon wachtwoord niet wijzigen.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Er is een fout opgetreden.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newUsername || !newUserPassword) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newUserPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUserSuccess('Gebruiker succesvol aangemaakt!');
        setNewUsername('');
        setNewUserPassword('');
        fetchUsers();
      } else {
        setUserError(data.error || 'Kon gebruiker niet aanmaken.');
      }
    } catch (err) {
      console.error(err);
      setUserError('Er is een fout opgetreden.');
    }
  };

  const handleDeleteUser = async (userId, usernameToDelete) => {
    if (!await showConfirm('Gebruiker verwijderen', `Weet je zeker dat je gebruiker "${usernameToDelete}" wilt verwijderen?`, true)) {
      return;
    }
    setUserError('');
    setUserSuccess('');

    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setUserSuccess('Gebruiker succesvol verwijderd!');
        fetchUsers();
      } else {
        setUserError(data.error || 'Kon gebruiker niet verwijderen.');
      }
    } catch (err) {
      console.error(err);
      setUserError('Er is een fout opgetreden.');
    }
  };

  const handleEditUserAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditUserAvatarFile(file);
      setEditUserAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAdminEditUser = async (e) => {
    e.preventDefault();
    setEditUserSuccessMessage('');
    if (!editUserId) return;

    try {
      const formData = new FormData();
      formData.append('id', editUserId);
      formData.append('username', editUserUsername);
      formData.append('name', editUserName);
      formData.append('email', editUserEmail);
      if (editUserPassword) {
        formData.append('newPassword', editUserPassword);
      }
      if (editUserAvatarFile) {
        formData.append('avatar', editUserAvatarFile);
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setEditUserSuccessMessage('Gebruiker succesvol bijgewerkt!');
        setEditUserPassword('');
        setEditUserAvatarFile(null);
        setEditUserAvatarPreview('');
        fetchUsers();
        setTimeout(() => {
          setEditUserId(null);
          setEditUserSuccessMessage('');
        }, 1500);
      } else {
        await showAlert('Fout', data.error || 'Kon gebruiker niet bijwerken.');
      }
    } catch (err) {
      console.error(err);
      await showAlert('Fout', 'Er is een fout opgetreden.');
    }
  };
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);

    try {
      const formData = new FormData();
      formData.append('username', operatorName);
      formData.append('name', profileName);
      formData.append('email', profileEmail);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccess('Profiel succesvol bijgewerkt!');
        if (data.avatar_path) {
          setProfileAvatar(data.avatar_path);
          setAvatarFile(null);
          setAvatarPreview('');
        }
        if (data.username && data.username !== operatorName) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          fetchUsers();
        }
      } else {
        setProfileError(data.error || 'Kon profiel niet bijwerken.');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Er is een fout opgetreden.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Drag-and-drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload Submission Handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    if (uploadFiles.length === 0) {
      setUploadError('Selecteer ten minste één foto of video om te uploaden.');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('env', uploadEnv);
      formData.append('category', uploadCategory);
      formData.append('subfolder', uploadSubfolder === 'new' ? newUploadSubfolderName : uploadSubfolder);
      formData.append('name', uploadName || 'Naamloos Voertuig');
      formData.append('location', uploadLocation || 'Onbekend');
      formData.append('date_taken', uploadDateTaken || 'Vandaag');
      formData.append('description', uploadDescription);
      
      uploadFiles.forEach((file) => {
        formData.append('files', file);
      });

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Bestanden uploaden mislukt');
      }

      setUploadSuccess(`${uploadFiles.length} bestand(en) succesvol geüpload!`);
      setUploadFiles([]);
      setUploadName('');
      setUploadLocation('');
      setUploadDateTaken('Vandaag');
      setUploadDescription('');
      setUploadSubfolder('none');
      setNewUploadSubfolderName('');
      
      fetchPhotos();
      fetchSubfolders();
      
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess('');
      }, 1200);

    } catch (err) {
      setUploadError(err.message || 'Er is een fout opgetreden tijdens het uploaden.');
    } finally {
      setUploading(false);
    }
  };

  // Edit Submission Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');

    try {
      const res = await fetch('/api/photos/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId,
          name: editName,
          env: editEnv,
          category: editCategory,
          subfolder: editSubfolder === 'new' ? newEditSubfolderName : editSubfolder,
          location: editLocation,
          date_taken: editDateTaken,
          description: editDescription
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Bewerkingen opslaan mislukt');
      }

      // Close modal and refresh listings
      setShowEditModal(false);
      fetchPhotos();
      fetchSubfolders();
    } catch (err) {
      setEditError(err.message || 'Er is een fout opgetreden tijdens het opslaan.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Photo Handler
  const handleDeletePhoto = async (photoId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    try {
      const res = await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: photoId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Media verwijderen mislukt');
      }

      setShowEditModal(false);
      setShowDeleteConfirm(false);
      fetchPhotos();
    } catch (err) {
      await showAlert('Fout', err.message);
    }
  };

  const handleCardDeleteClick = (photo, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedPhoto(photo);
    setEditId(photo.id);
    setEditName(photo.name);
    setEditEnv(photo.env);
    setEditCategory(photo.category);
    setEditSubfolder(photo.subfolder || 'none');
    setNewEditSubfolderName('');
    setEditLocation(photo.location);
    setEditDateTaken(photo.date_taken);
    setEditDescription(photo.description || '');
    setEditError('');
    setShowDeleteConfirm(true);
    setShowEditModal(true);
  };

  // Filtered photos list based on search bar query and category selection
  const filteredPhotos = photos.filter((photo) => {
    const isSpecialCategory = category === 'photos' || category === 'videos';

    const matchesCategory = 
      category === 'photos' ? photo.filetype === 'image' :
      category === 'videos' ? photo.filetype === 'video' :
      photo.category === category;

    if (!matchesCategory) return false;

    // Filter by subfolder if it's not a special tab (photos/videos)
    if (!isSpecialCategory) {
      const photoSub = photo.subfolder || null;
      if (photoSub !== currentSubfolder) return false;
    }

    const query = searchQuery.toLowerCase();
    if (!query) return true;
    
    return (
      photo.name.toLowerCase().includes(query) ||
      photo.location.toLowerCase().includes(query) ||
      photo.date_taken.toLowerCase().includes(query) ||
      (photo.description && photo.description.toLowerCase().includes(query)) ||
      photo.filename.toLowerCase().includes(query)
    );
  });

  // Sort photos based on selected sorting option
  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.id - a.id;
    }
    if (sortBy === 'oldest') {
      return a.id - b.id;
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    if (sortBy === 'location-asc') {
      return a.location.localeCompare(b.location);
    }
    return 0;
  });

  // Group sorted photos by (date_taken, location) for timeline
  const getGroupedPhotos = () => {
    const groups = [];
    const groupMap = {};
    sortedPhotos.forEach((photo) => {
      const key = `${photo.date_taken}||${photo.location}`;
      if (!groupMap[key]) {
        groupMap[key] = {
          date: photo.date_taken,
          location: photo.location,
          items: []
        };
        groups.push(groupMap[key]);
      }
      groupMap[key].items.push(photo);
    });
    return groups;
  };

  const groupedPhotos = getGroupedPhotos();

  // Helper to render photo/video card
  const renderPhotoCard = (photo) => (
    <div 
      key={photo.id} 
      className="photo-card"
      onContextMenu={(e) => openContextMenu(e, 'photo', photo)}
      onClick={() => {
        setSelectedPhoto(photo);
        setEditId(photo.id);
        setEditName(photo.name);
        setEditEnv(photo.env);
        setEditCategory(photo.category);
        setEditSubfolder(photo.subfolder || 'none');
        setNewEditSubfolderName('');
        setEditLocation(photo.location);
        setEditDateTaken(photo.date_taken);
        setEditDescription(photo.description || '');
        setEditError('');
        setShowDeleteConfirm(false);
        setShowEditModal(true);
      }}
    >
      {/* Delete trigger */}
      <button 
        type="button"
        className="media-delete-btn"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handleCardDeleteClick(photo, e)}
        title="Permanent verwijderen"
      >
        🗑️
      </button>

      {photo.filetype === 'video' ? (
        <div className="photo-card-img-wrapper" style={{ position: 'relative', width: '100%', height: '100%', background: 'black', overflow: 'hidden' }}>
          <video 
            src={photo.filepath} 
            className="photo-card-img"
            muted
            playsInline
            style={{ objectFit: 'cover' }}
          />
          <div className="video-play-indicator">
            ▶️
          </div>
        </div>
      ) : (
        <img 
          src={photo.filepath} 
          alt={photo.name} 
          className="photo-card-img"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:2rem;color:var(--text-muted)">🖼️</div>';
          }}
        />
      )}

      {/* Hover Overlay info */}
      <div className="photo-card-overlay">
        <div className="photo-card-name">{photo.name}</div>
        {photo.description && (
          <div className="photo-card-desc">{photo.description}</div>
        )}
      </div>

      {/* Footer text */}
      <div className="photo-card-footer">
        {photo.name}
      </div>
    </div>
  );

  // Category title label
  const getCategoryTitle = () => {
    if (category === 'photos') return "Alle Foto's";
    if (category === 'videos') return "Alle Video's";
    const matched = categories.find(c => c.name === category);
    if (matched) {
      return `${matched.emoji} ${matched.name.charAt(0).toUpperCase() + matched.name.slice(1)} Voertuigen`;
    }
    return 'Voertuigen Vault';
  };

  const activeLinks = shareTokensList.filter(t => t.revoked === 0 && new Date(t.expires_at) > new Date());

  return (
    <div className="dashboard-layout">
      {/* 1. SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link href="/portal" className="sidebar-brand">
            <span className="sidebar-brand-icon">☁️</span> UnVault
          </Link>
          <div className={`sidebar-badge ${env === 'rp' ? 'rp' : ''}`}>
            {env === 'rp' ? 'RP Server' : 'Echte Wereld'}
          </div>
        </div>

        <nav className="sidebar-menu" onContextMenu={handleSidebarContextMenu}>
          <div className="sidebar-label">Bibliotheek</div>
          <Link 
            href={`/dashboard/${env}/photos`} 
            className={`sidebar-item ${category === 'photos' ? 'active' : ''}`}
          >
            🖼️ Foto's
          </Link>
          <Link 
            href={`/dashboard/${env}/videos`} 
            className={`sidebar-item ${category === 'videos' ? 'active' : ''}`}
            style={{ marginBottom: '1.5rem' }}
          >
            🎥 Video's
          </Link>

          <div 
            className="sidebar-label-interactive" 
            onClick={() => setCollectionsExpanded(!collectionsExpanded)}
          >
            <span>Collecties</span>
            <span className="caret" style={{ transform: collectionsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
              ▼
            </span>
          </div>
          {collectionsExpanded && (
            <>
              {categories.map((cat) => {
                const catName = cat.name;
                const catEmoji = cat.emoji;
                const displayName = catName.charAt(0).toUpperCase() + catName.slice(1);
                
                const catPhotos = photos.filter(p => p.category === catName);
                const isExpanded = !!expandedCategories[catName];

                return (
                  <div key={cat.id} className="sidebar-folder-node" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div 
                      className={`sidebar-folder-header ${category === catName ? 'active' : ''}`}
                      onContextMenu={(e) => openContextMenu(e, 'category', cat)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => toggleCategoryExpand(catName, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          padding: '0.5rem 0.25rem 0.5rem 0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          transition: 'transform 0.2s ease',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}
                      >
                        ▶
                      </button>

                      <Link 
                        href={`/dashboard/${env}/${catName}`} 
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.5rem 0.5rem 0.25rem',
                          color: category === catName ? 'white' : 'var(--text-secondary)',
                          textDecoration: 'none'
                        }}
                      >
                        <span>{catEmoji}</span>
                        <span>{displayName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', background: 'rgba(255,255,255,0.04)', padding: '0.1rem 0.35rem', borderRadius: '10px' }}>
                          {catPhotos.length}
                        </span>
                      </Link>
                    </div>

                    {isExpanded && (
                      <div 
                        className="sidebar-folder-contents"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          paddingLeft: '1.25rem',
                          borderLeft: '1px dashed var(--border-color)',
                          marginLeft: '0.85rem',
                          marginTop: '0.125rem',
                          marginBottom: '0.25rem',
                          gap: '0.125rem'
                        }}
                      >
                        {catPhotos.length === 0 ? (
                          <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Geen voertuigen
                          </div>
                        ) : (
                          catPhotos.map((photo) => (
                            <div 
                              key={photo.id}
                              onClick={() => {
                                setSelectedPhoto(photo);
                                setEditId(photo.id);
                                setEditName(photo.name);
                                setEditEnv(photo.env);
                                setEditCategory(photo.category);
                                setEditSubfolder(photo.subfolder || 'none');
                                setNewEditSubfolderName('');
                                setEditLocation(photo.location);
                                setEditDateTaken(photo.date_taken);
                                setEditDescription(photo.description || '');
                                setEditError('');
                                setShowDeleteConfirm(false);
                                setShowEditModal(true);
                              }}
                              onContextMenu={(e) => openContextMenu(e, 'photo', photo)}
                              className="sidebar-file-item"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={photo.name}
                            >
                              <span>{photo.filetype === 'video' ? '🎥' : '🖼️'}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Category Form */}
              {showAddCategoryForm ? (
                <form onSubmit={handleAddCategory} className="sidebar-add-category-form">
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <select
                      value={newCategoryEmoji}
                      onChange={(e) => setNewCategoryEmoji(e.target.value)}
                    >
                      <option value="👮">👮</option>
                      <option value="🚒">🚒</option>
                      <option value="🚑">🚑</option>
                      <option value="🚁">🚁</option>
                      <option value="🚔">🚔</option>
                      <option value="🚢">🚢</option>
                      <option value="🚨">🚨</option>
                      <option value="🛡️">🛡️</option>
                      <option value="📦">📦</option>
                      <option value="🔍">🔍</option>
                      <option value="✈️">✈️</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Naam..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="sidebar-add-category-actions">
                    <button 
                      type="button" 
                      className="btn-sidebar-cancel"
                      onClick={() => setShowAddCategoryForm(false)}
                    >
                      Annuleer
                    </button>
                    <button 
                      type="submit"
                      className="btn-sidebar-submit"
                    >
                      Toevoegen
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="btn-sidebar-add-dashed"
                  onClick={() => setShowAddCategoryForm(true)}
                >
                  <span>➕</span>
                  <span>Categorie toevoegen</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Dynamic monitoring stats panel */}
        <div className="sidebar-footer">
          <div className="stat-panel-title">Unraid Opslag</div>
          <div className="stat-item">
            <div className="stat-header">
              <span>Array Gebruik</span>
              <span>{stats.storage?.used} TB / {stats.storage?.total} TB</span>
            </div>
            <div className="stat-bar-track">
              <div 
                className="stat-bar-fill" 
                style={{ width: `${stats.storage?.percent}%` }}
              ></div>
            </div>
          </div>

          <div className="stat-grid-usage" style={{ marginBottom: '1rem' }}>
            <div className="stat-usage-item">
              CPU: <span className="stat-usage-val">{stats.cpu}%</span>
            </div>
            <div className="stat-usage-item">
              RAM: <span className="stat-usage-val">{stats.ram}%</span>
            </div>
          </div>

          {/* Active Share Links Panel */}
          <div className="active-shares-panel" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
            <div className="stat-panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span>Actieve Deellinks</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                {activeLinks.length}/4
              </span>
            </div>
            
            {activeLinks.length === 0 ? (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' }}>
                Geen actieve deellinks.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
                {activeLinks.map((tokenItem) => {
                  const date = new Date(tokenItem.expires_at);
                  const formattedDate = `${date.getDate()}-${date.getMonth() + 1} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                  
                  return (
                    <div 
                      key={tokenItem.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid rgba(255, 255, 255, 0.06)', 
                        borderRadius: '6px', 
                        padding: '0.4rem 0.5rem', 
                        fontSize: '0.72rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', maxWidth: '70%', overflow: 'hidden' }}>
                        <span 
                          style={{ color: 'white', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                          title={tokenItem.photo_name || `Voertuig ID: ${tokenItem.photo_id}`}
                        >
                          {tokenItem.photo_name || `ID: ${tokenItem.photo_id}`}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                          Tot: {formattedDate}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            const absoluteLink = window.location.origin + '/share/' + tokenItem.token;
                            handleCopy(absoluteLink, tokenItem.id);
                          }}
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '0.75rem',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            color: copiedTokenId === tokenItem.id ? '#10b981' : 'inherit',
                            transform: copiedTokenId === tokenItem.id ? 'scale(1.2)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                          title="Kopieer Link"
                        >
                          {copiedTokenId === tokenItem.id ? '✔️' : '📋'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleRevokeActiveToken(tokenItem.id, tokenItem.photo_id)}
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '0.75rem',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Trek deellink in"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <main className="dashboard-main">
        {/* Header Bar */}
        <header className="header">
          <div className="header-search">
            <span className="header-search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Zoek naar foto's, locaties of beschrijvingen..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <button 
              className="btn-primary" 
              onClick={() => {
                setUploadError('');
                setUploadSuccess('');
                setShowUploadModal(true);
              }}
              style={{ background: 'var(--accent-blue)', color: 'white', borderRadius: '8px', padding: '0.5rem 1rem' }}
            >
              📤 Uploaden
            </button>
            {isAdmin && (
              <button 
                className="header-icon-btn settings-gear-btn" 
                onClick={() => {
                  addLog('[INFO] Instellingenpaneel geopend.');
                  fetchShareTokens();
                  setShowSettingsModal(true);
                }}
                title="Unraid API Instellingen"
              >
                ⚙️
              </button>
            )}
            <div 
              className="header-user" 
              onClick={() => {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordSuccess('');
                setPasswordError('');
                setUserSuccess('');
                setUserError('');
                setProfileSuccess('');
                setProfileError('');
                setAvatarFile(null);
                setAvatarPreview('');
                setShowAccountModal(true);
                setAccountTab('profile');
              }} 
              title="Accountinstellingen & Gebruikersbeheer"
            >
              <span className="header-user-name">{profileName || operatorName}</span>
              <div className="header-user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profileAvatar ? (
                  <img src={profileAvatar} alt="PFP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (profileName || operatorName).charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <button 
              className="header-icon-btn settings-gear-btn" 
              onClick={handleLogout}
              title="Uitloggen"
              style={{ fontSize: '1.2rem', color: 'var(--accent-red)' }}
            >
              🚪
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="content-body" onContextMenu={handleGridContextMenu}>
          <div className="page-title-area">
            <div>
              <h1 className="page-title">
                {getCategoryTitle()}
                <span className={`page-title-badge ${env === 'rp' ? 'rp' : ''}`}>
                  {env === 'rp' ? 'Roleplay' : 'Echte Wereld'}
                </span>
              </h1>
              <p className="page-subtitle">Tijdlijnweergave van gecatalogiseerde hulpverleningsvoertuigen.</p>
            </div>
            
            <div className="sort-controls">
              <span className="sort-label">Sorteren op:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">📅 Nieuwste Eerst</option>
                <option value="oldest">📅 Oudste Eerst</option>
                <option value="name-asc">🔤 Naam (A-Z)</option>
                <option value="name-desc">🔤 Naam (Z-A)</option>
                <option value="location-asc">📍 Locatie (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Subfolder Navigation Header */}
          {category !== 'photos' && category !== 'videos' && currentSubfolder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button 
                type="button" 
                onClick={() => setCurrentSubfolder(null)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'auto' }}
              >
                ⬅️ Terug naar Hoofdmap
              </button>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontWeight: '600', color: 'white' }}>📁 {currentSubfolder}</span>
            </div>
          )}

          {/* Subfolder list section (only when at the root of a regular category) */}
          {category !== 'photos' && category !== 'videos' && !currentSubfolder && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📁 Mappen
                </h3>
                
                {showAddSubfolderForm ? (
                  <form onSubmit={handleAddSubfolder} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Nieuwe mapnaam..." 
                      value={newSubfolderName}
                      onChange={(e) => setNewSubfolderName(e.target.value)}
                      required
                      className="form-input"
                      style={{ width: '180px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', height: '32px', width: 'auto' }}>
                      Opslaan
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={() => { setShowAddSubfolderForm(false); setNewSubfolderName(''); }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', height: '32px', width: 'auto' }}
                    >
                      Annuleer
                    </button>
                  </form>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setShowAddSubfolderForm(true)}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                  >
                    ➕ Map Toevoegen
                  </button>
                )}
              </div>

              {subfolders.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  Geen submappen aangemaakt.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                  {subfolders.map((folder) => {
                    const fileCount = photos.filter(p => p.category === category && p.subfolder === folder.name).length;
                    
                    return (
                      <div 
                        key={folder.id}
                        onClick={() => setCurrentSubfolder(folder.name)}
                        className="glass"
                        style={{ 
                          padding: '1rem', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)', 
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          background: 'rgba(255, 255, 255, 0.02)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSubfolder(folder.name, e)}
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Map verwijderen"
                        >
                          ✕
                        </button>

                        <div style={{ fontSize: '2rem' }}>📁</div>
                        <div style={{ fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }} title={folder.name}>
                          {folder.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {fileCount} {fileCount === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              Mediavault laden...
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
              {currentSubfolder ? 'Geen items gevonden in deze map.' : 'Geen losse items in deze collectie. Sleep bestanden of klik op uploaden!'}
            </div>
          ) : sortBy === 'newest' || sortBy === 'oldest' ? (
            <div className="timeline-section">
              {groupedPhotos.map((group, gIdx) => (
                <div key={gIdx} className="timeline-group">
                  <div className="timeline-group-header">
                    <h2 className="timeline-group-date">{group.date}</h2>
                    <span className="timeline-group-location">📍 {group.location}</span>
                  </div>

                  <div className="timeline-grid">
                    {group.items.map((photo) => renderPhotoCard(photo))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="timeline-grid" style={{ marginTop: '1.5rem' }}>
              {sortedPhotos.map((photo) => renderPhotoCard(photo))}
            </div>
          )}
        </div>
      </main>

      {/* 3. UPLOAD MODAL OVERLAY */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Bestanden uploaden naar Vault</h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body" style={{ maxHeight: '75vh' }}>
                {uploadError && <div className="auth-error">{uploadError}</div>}
                {uploadSuccess && <div className="banner">✔️ {uploadSuccess}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="uploadName">Voertuignaam / Model</label>
                  <input 
                    id="uploadName"
                    type="text" 
                    className="form-input" 
                    placeholder="bijv. Audi A6 Politie, Scania Brandweer" 
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="uploadLocation">Locatie / Plaats</label>
                    <input 
                      id="uploadLocation"
                      type="text" 
                      className="form-input" 
                      placeholder="bijv. Utrecht, NL" 
                      value={uploadLocation}
                      onChange={(e) => setUploadLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="uploadDateTaken">Datum genomen</label>
                    <input 
                      id="uploadDateTaken"
                      type="text" 
                      className="form-input" 
                      placeholder="bijv. Vandaag, Gisteren, 24 okt" 
                      value={uploadDateTaken}
                      onChange={(e) => setUploadDateTaken(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="uploadCategory">Categorie</label>
                    <select 
                      id="uploadCategory"
                      className="form-input" 
                      value={uploadCategory} 
                      onChange={(e) => { setUploadCategory(e.target.value); setUploadSubfolder('none'); }}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '42px', color: 'white' }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name} style={{ background: 'var(--bg-secondary)', color: 'white' }}>
                          {cat.emoji} {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="uploadEnv">Omgeving</label>
                    <select 
                      id="uploadEnv"
                      className="form-input" 
                      value={uploadEnv} 
                      onChange={(e) => setUploadEnv(e.target.value)}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '42px' }}
                    >
                      <option value="irl">Echte Wereld</option>
                      <option value="rp">Roleplay Server</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: uploadSubfolder === 'new' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="uploadSubfolder">Map (Submap)</label>
                    <select 
                      id="uploadSubfolder"
                      className="form-input" 
                      value={uploadSubfolder} 
                      onChange={(e) => setUploadSubfolder(e.target.value)}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '42px', color: 'white' }}
                    >
                      <option value="none" style={{ background: 'var(--bg-secondary)', color: 'white' }}>Geen (Hoofdmap)</option>
                      {allSubfolders.filter(sub => sub.category === uploadCategory).map((sub) => (
                        <option key={sub.id} value={sub.name} style={{ background: 'var(--bg-secondary)', color: 'white' }}>
                          📁 {sub.name}
                        </option>
                      ))}
                      <option value="new" style={{ background: 'var(--bg-secondary)', color: 'white' }}>+ Nieuwe map maken...</option>
                    </select>
                  </div>
                  {uploadSubfolder === 'new' && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="newUploadSubfolderName">Nieuwe mapnaam</label>
                      <input 
                        id="newUploadSubfolderName"
                        type="text" 
                        className="form-input" 
                        placeholder="Naam..." 
                        value={newUploadSubfolderName}
                        onChange={(e) => setNewUploadSubfolderName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="uploadDescription">Beschrijving</label>
                  <textarea 
                    id="uploadDescription"
                    className="form-input" 
                    placeholder="Voer details, specificaties of waarnemingen in over dit voertuig..." 
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    style={{ height: '70px', resize: 'none' }}
                  />
                </div>

                {/* Drag & Drop File Target */}
                <div 
                  className={`drag-drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <span className="drag-drop-icon">📁</span>
                  <p className="drag-drop-text">Sleep bestanden hiernaartoe of klik om te bladeren</p>
                  <p className="drag-drop-subtext">Ondersteunt afbeeldingen en video-uploads</p>
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef}
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                  />
                </div>

                {/* File list indicators */}
                {uploadFiles.length > 0 && (
                  <div className="file-list">
                    {uploadFiles.map((file, idx) => (
                      <div key={idx} className="file-list-item">
                        <span className="file-list-name">{file.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</span>
                        <button 
                           type="button" 
                           className="file-list-remove" 
                           onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Annuleren
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={uploading}
                >
                  {uploading ? 'Uploaden...' : 'Opslaan in Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DETAILS & EDIT MODAL OVERLAY (SIDE-BY-SIDE) */}
      {showEditModal && selectedPhoto && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content glass" style={{ maxWidth: '960px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🖼️ Voertuigdetails & Bewerker</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ padding: 0 }}>
                <div className="editor-modal-container">
                  {/* Left Side: Large Photo Preview */}
                  <div className="editor-modal-preview" style={{ flexDirection: 'column', gap: '1rem' }}>
                    {selectedPhoto.filetype === 'image' ? (
                      <img 
                        src={selectedPhoto.filepath} 
                        alt={selectedPhoto.name} 
                        className="editor-modal-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<div style="font-size:4rem;">🖼️</div>';
                        }}
                      />
                    ) : (
                      <video 
                        src={selectedPhoto.filepath} 
                        controls 
                        className="editor-modal-img"
                        style={{ background: 'black' }}
                      />
                    )}
                    
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={() => {
                        setDurationDays('3');
                        fetchActiveShareToken(selectedPhoto.id);
                        setShowShareModal(true);
                      }}
                      style={{ 
                        width: 'auto', 
                        padding: '0.4rem 1.2rem', 
                        background: 'rgba(37, 99, 235, 0.2)', 
                        border: '1px solid var(--accent-blue)', 
                        color: 'var(--accent-blue)', 
                        borderRadius: '20px', 
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                      onMouseOver={(e) => { e.target.style.background = 'var(--accent-blue)'; e.target.style.color = 'white'; }}
                      onMouseOut={(e) => { e.target.style.background = 'rgba(37, 99, 235, 0.2)'; e.target.style.color = 'var(--accent-blue)'; }}
                    >
                      🔗 Dit voertuig delen
                    </button>
                  </div>

                  {/* Right Side: Edit Form Fields */}
                  <div className="editor-modal-form">
                    {editError && <div className="auth-error">{editError}</div>}

                    <div className="form-group">
                      <label className="form-label" htmlFor="editName">Voertuignaam / Model</label>
                      <input 
                        id="editName"
                        type="text" 
                        className="form-input" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="editLocation">Locatie</label>
                        <input 
                          id="editLocation"
                          type="text" 
                          className="form-input" 
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="editDateTaken">Datum genomen</label>
                        <input 
                          id="editDateTaken"
                          type="text" 
                          className="form-input" 
                          value={editDateTaken}
                          onChange={(e) => setEditDateTaken(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="editCategory">Categorie</label>
                        <select 
                          id="editCategory"
                          className="form-input" 
                          value={editCategory} 
                          onChange={(e) => { setEditCategory(e.target.value); setEditSubfolder('none'); }}
                          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '42px', color: 'white' }}
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.name} style={{ background: 'var(--bg-secondary)', color: 'white' }}>
                              {cat.emoji} {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="editEnv">Omgeving</label>
                        <select 
                          id="editEnv"
                          className="form-input" 
                          value={editEnv} 
                          onChange={(e) => setEditEnv(e.target.value)}
                          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '42px' }}
                        >
                          <option value="irl">Echte Wereld</option>
                          <option value="rp">Roleplay Server</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: editSubfolder === 'new' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="editSubfolder">Map (Submap)</label>
                        <select 
                          id="editSubfolder"
                          className="form-input" 
                          value={editSubfolder} 
                          onChange={(e) => setEditSubfolder(e.target.value)}
                          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '42px', color: 'white' }}
                        >
                          <option value="none" style={{ background: 'var(--bg-secondary)', color: 'white' }}>Geen (Hoofdmap)</option>
                          {allSubfolders.filter(sub => sub.category === editCategory).map((sub) => (
                            <option key={sub.id} value={sub.name} style={{ background: 'var(--bg-secondary)', color: 'white' }}>
                              📁 {sub.name}
                            </option>
                          ))}
                          <option value="new" style={{ background: 'var(--bg-secondary)', color: 'white' }}>+ Nieuwe map maken...</option>
                        </select>
                      </div>
                      {editSubfolder === 'new' && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="newEditSubfolderName">Nieuwe mapnaam</label>
                          <input 
                            id="newEditSubfolderName"
                            type="text" 
                            className="form-input" 
                            placeholder="Naam..." 
                            value={newEditSubfolderName}
                            onChange={(e) => setNewEditSubfolderName(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="editDescription">Waarneming / Beschrijving</label>
                      <textarea 
                        id="editDescription"
                        className="form-input" 
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        style={{ height: '100px', resize: 'none' }}
                        placeholder="Schrijf een beschrijving of specificaties voor dit voertuig..."
                      />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Bestandsnaam: {selectedPhoto.filename} • Grootte: {(selectedPhoto.filesize / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ background: 'var(--bg-secondary)' }}>
                {showDeleteConfirm ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: 'auto' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#fca5a5', fontWeight: '500' }}>Verwijdering bevestigen?</span>
                    <button 
                      type="button" 
                      className="btn-danger" 
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8125rem' }}
                      onClick={(e) => handleDeletePhoto(selectedPhoto.id, e)}
                    >
                      Verwijderen
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8125rem' }}
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                    >
                      Annuleren
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="btn-danger" 
                    style={{ marginRight: 'auto' }}
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                  >
                    🗑️ Voertuig Verwijderen
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Annuleren
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={savingEdit}
                  style={{ width: 'auto' }}
                >
                  {savingEdit ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DEV SETTINGS & UNRAID API CONTROLS MODAL */}
      {showSettingsModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content glass" style={{ maxWidth: '800px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚙️ Unraid API & Site Control Panel</h2>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem' }}>
              
              {/* Left Column: Settings & Controls */}
              <div className="settings-controls-pane">
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Unraid API Configuraties
                </h3>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="unraidUrl">API Server Endpoint</label>
                  <input 
                    id="unraidUrl"
                    type="text" 
                    className="form-input" 
                    value={unraidApiUrl}
                    onChange={(e) => saveUrl(e.target.value)}
                    placeholder="http://192.168.1.50:8899/api/unraid"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="unraidKey">API Beveiligingssleutel</label>
                  <input 
                    id="unraidKey"
                    type="password" 
                    className="form-input" 
                    value={unraidApiKey}
                    onChange={(e) => saveKey(e.target.value)}
                    placeholder="Voer API token in..."
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                  <input 
                    id="mockMetricsToggle"
                    type="checkbox" 
                    checked={mockMetrics}
                    onChange={(e) => saveMockMetrics(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label className="form-label" htmlFor="mockMetricsToggle" style={{ marginBottom: 0, cursor: 'pointer', userSelect: 'none', color: 'white' }}>
                    🖥️ Gebruik mock-statistieken (Mocks aan)
                  </label>
                </div>

                <div className="settings-actions-group" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    style={{ flex: 1, height: '40px', fontSize: '0.875rem' }}
                  >
                    {testingConnection ? 'Laden...' : '🔌 Verbinding Testen'}
                  </button>
                </div>

                <div 
                  className="read-only-badge"
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(37, 99, 235, 0.1)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--accent-blue)',
                    lineHeight: '1.4'
                  }}
                >
                  🔒 <strong>Status: Alleen Lezen (Read-Only API)</strong>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Actieve bewerkingen (zoals mover starten en array besturing) zijn gedeactiveerd in deze weergave om onbedoelde wijzigingen te voorkomen.
                  </div>
                </div>

                {/* Developer Token Management Dashboard */}
                <h3 style={{ margin: '1.5rem 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Gedeelde Deellinks Beheren
                </h3>
                
                {loadingTokens ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Laden...</div>
                ) : shareTokensList.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Geen gedeelde links gevonden.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                    {shareTokensList.map((tokenItem) => {
                      const isExpired = new Date(tokenItem.expires_at) < new Date();
                      const isRevoked = tokenItem.revoked === 1;
                      
                      let statusText = 'Actief';
                      let statusColor = '#10b981';
                      if (isRevoked) {
                        statusText = 'Ingetrokken';
                        statusColor = '#ef4444';
                      } else if (isExpired) {
                        statusText = 'Verlopen';
                        statusColor = '#f59e0b';
                      }

                      return (
                        <div key={tokenItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.375rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', maxWidth: '65%' }}>
                            <strong style={{ color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tokenItem.photo_name}>
                              {tokenItem.photo_name || `ID: ${tokenItem.photo_id}`}
                            </strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              Verloopt: {new Date(tokenItem.expires_at).toLocaleString('nl-NL')}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: statusColor, fontWeight: 'bold' }}>
                              {statusText} • Door: {tokenItem.created_by}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {!isRevoked && !isExpired && (
                              <button 
                                type="button"
                                onClick={() => handleManageShare(tokenItem.id, 'revoke')}
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.65rem' }}
                              >
                                Intrekken
                              </button>
                            )}
                            {(isRevoked || isExpired) && (
                              <button 
                                type="button"
                                onClick={() => handleManageShare(tokenItem.id, 'extend')}
                                style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.65rem' }}
                              >
                                Verlengen
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Console Logs */}
              <div className="settings-logs-pane" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem' }}>API Transactie Logs</h3>
                  <button 
                    type="button" 
                    onClick={handleClearLogs}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Wissen
                  </button>
                </div>
                
                <div 
                  className="terminal-console"
                  style={{
                    flex: 1,
                    minHeight: '280px',
                    background: '#0d1117',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#c9d1d9',
                    overflowY: 'auto',
                    maxHeight: '380px'
                  }}
                >
                  {apiLogs.map((log, idx) => {
                    let color = '#c9d1d9';
                    if (log.includes('[SYSTEM]')) color = '#58a6ff';
                    else if (log.includes('[OK]')) color = '#56d364';
                    else if (log.includes('[ACTION]')) color = '#ff7b72';
                    else if (log.includes('[CONNECT]')) color = '#d2a8ff';
                    else if (log.includes('[MOVER]')) color = '#e3b341';
                    
                    return (
                      <div key={idx} style={{ color, marginBottom: '0.25rem', wordBreak: 'break-all', lineHeight: '1.3' }}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="modal-footer" style={{ background: 'var(--bg-secondary)', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowSettingsModal(false)}
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SHARE LINK GENERATION MODAL (USER/OFFICER) */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => { setShowShareModal(false); setShareLink(''); setShareError(''); setActiveToken(null); }}>
          <div className="modal-content glass" style={{ maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔗 Deel dit Voertuig</h2>
              <button className="modal-close" onClick={() => { setShowShareModal(false); setShareLink(''); setShareError(''); setActiveToken(null); }}>✕</button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Genereer een tijdelijke token-link om deze voertuiggegevens en foto te delen. Iedereen met deze link heeft alleen-lezen toegang tot deze specificaties.
              </p>

              {shareError && <div className="auth-error" style={{ marginBottom: '1rem' }}>{shareError}</div>}

              {loadingActiveToken ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  Status controleren...
                </div>
              ) : activeToken ? (
                <div>
                  <div className="form-group">
                    <label className="form-label">Gegenereerde deellink</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        readOnly 
                        value={shareLink}
                        onClick={(e) => e.target.select()}
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem', flex: 1 }}
                      />
                      <button 
                        type="button" 
                        className="btn-primary"
                        style={{ 
                          width: 'auto', 
                          padding: '0 1rem', 
                          background: copiedShareLink ? '#10b981' : 'var(--accent-blue)', 
                          color: 'white', 
                          borderRadius: '8px',
                          transition: 'background 0.2s ease'
                        }}
                        onClick={() => {
                          handleCopy(shareLink);
                        }}
                      >
                        {copiedShareLink ? 'Gekopieerd! ✔️' : 'Kopieer'}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontWeight: '500' }}>
                    ✔️ Link is actief en verloopt op {new Date(activeToken.expires_at).toLocaleString('nl-NL')}.
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ width: '100%', padding: '0.6rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      onClick={() => handleRevokeActiveToken(activeToken.id, selectedPhoto?.id)}
                      disabled={generatingShare}
                    >
                      {generatingShare ? 'Link intrekken...' : '❌ Link Annuleren / Intrekken'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label" htmlFor="shareDuration">Geldigheidsduur deellink</label>
                    <select
                      id="shareDuration"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '42px', color: 'white' }}
                    >
                      <option value="1">1 dag</option>
                      <option value="3">3 dagen (Standaard)</option>
                      <option value="7">7 dagen</option>
                      <option value="30">30 dagen</option>
                    </select>
                  </div>

                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    {generatingShare ? (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Deellink genereren...</div>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={() => handleGenerateShare(selectedPhoto?.id, durationDays)}
                        style={{ width: '100%', height: '42px', background: 'var(--accent-blue)', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}
                      >
                        Genereer Deellink
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setShowShareModal(false); setShareLink(''); setShareError(''); setActiveToken(null); }}
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-click custom context menu (dropdown) */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 10001,
            minWidth: '200px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'photo' && (
            <>
              <div className="context-menu-header">Voertuig: {contextMenu.data.name}</div>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  const photo = contextMenu.data;
                  setSelectedPhoto(photo);
                  setEditId(photo.id);
                  setEditName(photo.name);
                  setEditEnv(photo.env);
                  setEditCategory(photo.category);
                  setEditSubfolder(photo.subfolder || 'none');
                  setNewEditSubfolderName('');
                  setEditLocation(photo.location);
                  setEditDateTaken(photo.date_taken);
                  setEditDescription(photo.description || '');
                  setEditError('');
                  setShowDeleteConfirm(false);
                  setShowEditModal(true);
                  setContextMenu(null);
                }}
              >
                <span>📂</span> Openen
              </button>
              
              <div style={{ position: 'relative' }} className="submenu-trigger">
                <button type="button" className="context-menu-item">
                  <span>➡️</span> Verplaatsen naar... <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>▶</span>
                </button>
                <div className="context-menu submenu">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`context-menu-item ${contextMenu.data.category === cat.name ? 'active' : ''}`}
                      onClick={async () => {
                        const photoId = contextMenu.data.id;
                        const newCat = cat.name;
                        setContextMenu(null);
                        try {
                          const res = await fetch('/api/photos/categorize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: photoId, category: newCat })
                          });
                          if (res.ok) {
                            fetchPhotos();
                            showToast(`Voertuig verplaatst naar ${newCat}!`);
                          } else {
                            const data = await res.json();
                            await showAlert('Fout', data.error || 'Kon categorie niet wijzigen');
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      <span>{cat.emoji}</span> {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  setDurationDays('3');
                  fetchActiveShareToken(contextMenu.data.id);
                  setShowShareModal(true);
                  setContextMenu(null);
                }}
              >
                <span>🔗</span> Deellink maken...
              </button>

              <button
                type="button"
                className="context-menu-item"
                onClick={async () => {
                  const photo = contextMenu.data;
                  setContextMenu(null);
                  const newName = await showPrompt('Hernoemen', 'Voer nieuwe naam in voor voertuig:', photo.name);
                  if (newName && newName.trim() && newName.trim() !== photo.name) {
                    try {
                      const res = await fetch('/api/photos/rename', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: photo.id, name: newName })
                      });
                      if (res.ok) {
                        fetchPhotos();
                        showToast('Voertuig succesvol hernoemd!');
                      } else {
                        const data = await res.json();
                        await showAlert('Fout', data.error || 'Hernoemen mislukt');
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
              >
                <span>✏️</span> Hernoemen...
              </button>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0.25rem 0' }} />

              <button
                type="button"
                className="context-menu-item"
                style={{ color: 'var(--accent-red)' }}
                onClick={async () => {
                  const photo = contextMenu.data;
                  setContextMenu(null);
                  if (await showConfirm('Voertuig verwijderen', `Weet je zeker dat je ${photo.name} wilt verwijderen?`, true)) {
                    handleDeletePhoto(photo.id);
                  }
                }}
              >
                <span>🗑️</span> Verwijderen
              </button>
            </>
          )}

          {contextMenu.type === 'category' && (
            <>
              <div className="context-menu-header">Map: {contextMenu.data.name}</div>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  router.push(`/dashboard/${env}/${contextMenu.data.name}`);
                  setContextMenu(null);
                }}
              >
                <span>📂</span> Openen
              </button>
              
              <button
                type="button"
                className="context-menu-item"
                onClick={async () => {
                  const cat = contextMenu.data;
                  setContextMenu(null);
                  const result = await showCategoryForm('Map/Categorie bewerken', cat.name, cat.emoji || '📁');
                  if (result && result.name && result.name.trim()) {
                    const newName = result.name.trim();
                    const newEmoji = result.emoji ? result.emoji.trim() : cat.emoji;
                    try {
                      const res = await fetch('/api/categories', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oldName: cat.name, newName, emoji: newEmoji })
                      });
                      if (res.ok) {
                        fetchCategories();
                        fetchPhotos();
                        if (category === cat.name) {
                          router.push(`/dashboard/${env}/${newName.toLowerCase().trim()}`);
                        }
                        showToast('Map succesvol hernoemd!');
                      } else {
                        const data = await res.json();
                        await showAlert('Fout', data.error || 'Hernoemen mislukt');
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
              >
                <span>✏️</span> Map Hernoemen...
              </button>

              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  setShowAddCategoryForm(true);
                  setContextMenu(null);
                }}
              >
                <span>➕</span> Nieuwe categorie maken...
              </button>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0.25rem 0' }} />

              <button
                type="button"
                className="context-menu-item"
                style={{ color: 'var(--accent-red)' }}
                onClick={async () => {
                  const cat = contextMenu.data;
                  setContextMenu(null);
                  if (await showConfirm('Categorie verwijderen', `Weet je zeker dat je map/categorie "${cat.name}" wilt verwijderen? Al haar voertuigen worden verplaatst naar de standaard categorie.`, true)) {
                    try {
                      const res = await fetch(`/api/categories?name=${cat.name}`, {
                        method: 'DELETE'
                      });
                      if (res.ok) {
                        fetchCategories();
                        fetchPhotos();
                        if (category === cat.name) {
                          router.push(`/dashboard/${env}/politie`);
                        }
                        showToast('Map succesvol verwijderd!');
                      } else {
                        const data = await res.json();
                        await showAlert('Fout', data.error || 'Verwijderen mislukt');
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
              >
                <span>🗑️</span> Map Verwijderen
              </button>
            </>
          )}

          {contextMenu.type === 'grid-blank' && (
            <>
              <div className="context-menu-header">Bureaublad Opties</div>
              {category !== 'photos' && category !== 'videos' && (
                <button
                  type="button"
                  className="context-menu-item"
                  onClick={async () => {
                    setContextMenu(null);
                    const name = await showPrompt('Nieuwe map', 'Voer naam in voor de nieuwe submap:');
                    if (name && name.trim()) {
                      try {
                        const res = await fetch('/api/subfolders', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ category, name: name.trim(), env })
                        });
                        if (res.ok) {
                          fetchSubfolders();
                          showToast('Nieuwe submap succesvol aangemaakt!');
                        } else {
                          const data = await res.json();
                          await showAlert('Fout', data.error || 'Fout bij maken submap');
                        }
                      } catch (err) {
                        console.error(err);
                        await showAlert('Fout', 'Er is een fout opgetreden.');
                      }
                    }
                  }}
                >
                  <span>📁</span> Nieuwe Map (Submap)...
                </button>
              )}
              
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  setUploadError('');
                  setUploadSuccess('');
                  setShowUploadModal(true);
                  setContextMenu(null);
                }}
              >
                <span>📤</span> Voertuig uploaden...
              </button>
            </>
          )}

          {contextMenu.type === 'sidebar-blank' && (
            <>
              <div className="context-menu-header">Sidebar Opties</div>
              <button
                type="button"
                className="context-menu-item"
                onClick={async () => {
                  setContextMenu(null);
                  const result = await showCategoryForm('Nieuwe Categorie Maken', '', '📁');
                  if (result && result.name && result.name.trim()) {
                    try {
                      const res = await fetch('/api/categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: result.name.trim(), emoji: result.emoji || '📁' })
                      });
                      if (res.ok) {
                        fetchCategories();
                        showToast('Nieuwe categorie succesvol aangemaakt!');
                      } else {
                        const data = await res.json();
                        await showAlert('Fout', data.error || 'Fout bij maken categorie');
                      }
                    } catch (err) {
                      console.error(err);
                      await showAlert('Fout', 'Er is een fout opgetreden.');
                    }
                  }
                }}
              >
                <span>➕</span> Nieuwe Categorie...
              </button>
            </>
          )}
        </div>
      )}

      {/* 7. ACCOUNT SETTINGS & GEBRUIKERSBEHEER MODAL */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content glass" style={{ maxWidth: '600px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  👤 Accountinstellingen
                </h2>
                <button className="modal-close" onClick={() => setShowAccountModal(false)}>✕</button>
              </div>
              
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setAccountTab('profile')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: accountTab === 'profile' ? 'var(--accent-blue)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  👤 Profiel
                </button>
                <button
                  type="button"
                  onClick={() => setAccountTab('password')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: accountTab === 'password' ? 'var(--accent-blue)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔑 Wachtwoord
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setAccountTab('users');
                      fetchUsers();
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: accountTab === 'users' ? 'var(--accent-blue)' : 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    👥 Gebruikersbeheer
                  </button>
                )}
              </div>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
              {accountTab === 'profile' ? (
                /* Profiel Wijzigen Tab */
                <form onSubmit={handleUpdateProfile}>
                  {profileError && <div className="auth-error">{profileError}</div>}
                  {profileSuccess && <div className="banner" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#a7f3d0', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1.25rem' }}>✔️ {profileSuccess}</div>}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div 
                      style={{ 
                        position: 'relative', 
                        width: '90px', 
                        height: '90px', 
                        borderRadius: '50%', 
                        border: '2px solid var(--border-color)', 
                        background: 'var(--bg-secondary)', 
                        overflow: 'hidden', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }} 
                      onClick={() => document.getElementById('avatarInput').click()}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : profileAvatar ? (
                        <img src={profileAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}>
                          {(profileName || operatorName).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0, 0, 0, 0.6)', color: 'white', fontSize: '0.65rem', textAlign: 'center', padding: '0.2rem 0', fontWeight: 'bold' }}>
                        WIJZIGEN
                      </div>
                    </div>
                    <input
                      id="avatarInput"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Klik op de cirkel om een profielfoto te kiezen.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="profileName">Naam</label>
                    <input
                      id="profileName"
                      type="text"
                      className="form-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="bijv. Inspecteur Jansen"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="profileEmail">E-mailadres</label>
                    <input
                      id="profileEmail"
                      type="email"
                      className="form-input"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="bijv. jansen@politie.nl"
                    />
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={savingProfile}
                      style={{ background: 'var(--accent-blue)', color: 'white' }}
                    >
                      {savingProfile ? 'Opslaan...' : 'Profiel Opslaan'}
                    </button>
                  </div>
                </form>
              ) : accountTab === 'password' ? (
                /* Wachtwoord Wijzigen Tab */
                <form onSubmit={handleChangePassword}>
                  {passwordError && <div className="auth-error">{passwordError}</div>}
                  {passwordSuccess && <div className="banner" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#a7f3d0', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1.25rem' }}>✔️ {passwordSuccess}</div>}

                  <div className="form-group">
                    <label className="form-label" htmlFor="oldPassword">Huidig Wachtwoord</label>
                    <input
                      id="oldPassword"
                      type="password"
                      className="form-input"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      placeholder="Voer je huidige wachtwoord in"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newPassword">Nieuw Wachtwoord</label>
                    <input
                      id="newPassword"
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Voer je nieuwe wachtwoord in"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">Nieuw Wachtwoord Bevestigen</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Bevestig je nieuwe wachtwoord"
                    />
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={savingPassword}
                      style={{ background: 'var(--accent-blue)', color: 'white' }}
                    >
                      {savingPassword ? 'Wachtwoord opslaan...' : 'Wachtwoord Bijwerken'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Gebruikersbeheer Tab */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {userError && <div className="auth-error">{userError}</div>}
                  {userSuccess && <div className="banner" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#a7f3d0', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1.25rem' }}>✔️ {userSuccess}</div>}

                  {/* Create User Section */}
                  {isAdmin && (
                    <div className="glass" style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.01)' }}>
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'white' }}>➕ Nieuwe Gebruiker Aanmaken</h3>
                      <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" htmlFor="newUsername">Gebruikersnaam</label>
                            <input
                              id="newUsername"
                              type="text"
                              className="form-input"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              required
                              placeholder="Gebruikersnaam"
                              style={{ height: '38px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" htmlFor="newUserPassword">Wachtwoord</label>
                            <input
                              id="newUserPassword"
                              type="password"
                              className="form-input"
                              value={newUserPassword}
                              onChange={(e) => setNewUserPassword(e.target.value)}
                              required
                              placeholder="Wachtwoord"
                              style={{ height: '38px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ height: '38px', padding: '0.5rem', width: '100%', fontSize: '0.85rem', marginTop: '0.25rem' }}
                        >
                          Gebruiker Opslaan
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Reset password overlay or inline section */}
                  {/* Admin Edit User Panel */}
                  {editUserId && isAdmin && (
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--accent-blue)', background: 'rgba(37, 99, 235, 0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        👤 Gebruikersgegevens Bewerken: {editUserUsername}
                        <button type="button" onClick={() => setEditUserId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                      </h3>
                      {editUserSuccessMessage && <div className="banner" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#a7f3d0', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem' }}>✔️ {editUserSuccessMessage}</div>}
                      
                      <form onSubmit={handleAdminEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Avatar edit section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div 
                            style={{ 
                              position: 'relative', 
                              width: '60px', 
                              height: '60px', 
                              borderRadius: '50%', 
                              border: '1.5px solid var(--border-color)', 
                              background: 'var(--bg-secondary)', 
                              overflow: 'hidden', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                            onClick={() => document.getElementById('editUserAvatarInput').click()}
                          >
                            {editUserAvatarPreview ? (
                              <img src={editUserAvatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : usersList.find(u => u.id === editUserId)?.avatar_path ? (
                              <img src={usersList.find(u => u.id === editUserId).avatar_path} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>
                                {editUserUsername.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0, 0, 0, 0.6)', color: 'white', fontSize: '0.5rem', textAlign: 'center', padding: '0.1rem 0' }}>
                              EDIT
                            </div>
                          </div>
                          <input
                            id="editUserAvatarInput"
                            type="file"
                            accept="image/*"
                            onChange={handleEditUserAvatarChange}
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Klik op de cirkel om profielfoto van de gebruiker te wijzigen.</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>Naam</label>
                            <input
                              type="text"
                              className="form-input"
                              value={editUserName}
                              onChange={(e) => setEditUserName(e.target.value)}
                              placeholder="Naam"
                              style={{ height: '38px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>E-mailadres</label>
                            <input
                              type="email"
                              className="form-input"
                              value={editUserEmail}
                              onChange={(e) => setEditUserEmail(e.target.value)}
                              placeholder="E-mailadres"
                              style={{ height: '38px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Nieuw Wachtwoord (Optioneel)</label>
                          <input
                            type="password"
                            className="form-input"
                            value={editUserPassword}
                            onChange={(e) => setEditUserPassword(e.target.value)}
                            placeholder="Laat leeg om niet te wijzigen"
                            style={{ height: '38px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ height: '38px', padding: '0.5rem', width: '100%', fontSize: '0.85rem', marginTop: '0.25rem' }}
                        >
                          Wijzigingen Opslaan
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Users List */}
                  <div>
                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'white' }}>
                      {isAdmin ? '👥 Bestaande Gebruikers' : '👤 Mijn Accountgegevens'}
                    </h3>
                    {loadingUsers ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Gebruikers laden...</div>
                    ) : usersList.length === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>Geen andere gebruikers gevonden.</div>
                    ) : (
                      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Gebruiker</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Aangemaakt Op</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Acties</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersList.map((usr) => {
                              const createdDate = usr.created_at ? new Date(usr.created_at).toLocaleDateString('nl-NL') : 'Onbekend';
                              const isSelf = usr.username === operatorName;
                              return (
                                <tr key={usr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: 'white' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                      <span>{usr.name || usr.username}</span>
                                      {isSelf && <span style={{ fontSize: '0.7rem', background: 'rgba(37, 99, 235, 0.2)', color: 'var(--accent-blue)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>jij</span>}
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{createdDate}</td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditUserId(usr.id);
                                          setEditUserUsername(usr.username);
                                          setEditUserName(usr.name || '');
                                          setEditUserEmail(usr.email || '');
                                          setEditUserPassword('');
                                          setEditUserAvatarFile(null);
                                          setEditUserAvatarPreview('');
                                          setEditUserSuccessMessage('');
                                        }}
                                        style={{
                                          background: 'rgba(255, 255, 255, 0.05)',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          borderRadius: '4px',
                                          color: 'white',
                                          padding: '0.25rem 0.5rem',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease'
                                        }}
                                        title="Gebruikersgegevens bewerken"
                                      >
                                        ✏️ Bewerk
                                      </button>
                                    )}
                                    {(!isSelf || (!isAdmin && isSelf)) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(usr.id, usr.username)}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.1)',
                                          border: '1px solid rgba(239, 68, 68, 0.2)',
                                          borderRadius: '4px',
                                          color: '#fca5a5',
                                          padding: '0.25rem 0.5rem',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease'
                                        }}
                                        title={isSelf ? "Mijn account verwijderen" : "Gebruiker verwijderen"}
                                      >
                                        🗑️ Wis
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAccountModal(false)}
                style={{ width: 'auto' }}
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CUSTOM DIALOG MODALS (ALERT, CONFIRM, PROMPT, CATEGORYFORM) */}
      {customModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => {
          customModal.resolve(null);
          setCustomModal(null);
        }}>
          <div className="modal-content glass" style={{ maxWidth: '450px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {customModal.type === 'alert' && '⚠️ Melding'}
                {customModal.type === 'confirm' && '❓ Bevestiging'}
                {customModal.type === 'prompt' && '✏️ Invoer Vereist'}
                {customModal.type === 'categoryForm' && '📁 Categorie Details'}
              </h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  customModal.resolve(null);
                  setCustomModal(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {customModal.message && (
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                  {customModal.message}
                </p>
              )}

              {/* Prompt Input Field */}
              {customModal.type === 'prompt' && (
                <input
                  type="text"
                  className="form-input"
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      customModal.resolve(dialogInput);
                      setCustomModal(null);
                    }
                  }}
                  style={{ width: '100%' }}
                />
              )}

              {/* CategoryForm Input Fields */}
              {customModal.type === 'categoryForm' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem' }}>Naam</label>
                    <input
                      type="text"
                      className="form-input"
                      value={dialogCategoryName}
                      onChange={(e) => setDialogCategoryName(e.target.value)}
                      placeholder="bijv. Brandweer"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          customModal.resolve({ name: dialogCategoryName, emoji: dialogCategoryEmoji });
                          setCustomModal(null);
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem' }}>Emoji / Icoon</label>
                    <input
                      type="text"
                      className="form-input"
                      value={dialogCategoryEmoji}
                      onChange={(e) => setDialogCategoryEmoji(e.target.value)}
                      placeholder="bijv. 🚒"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          customModal.resolve({ name: dialogCategoryName, emoji: dialogCategoryEmoji });
                          setCustomModal(null);
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  customModal.resolve(null);
                  setCustomModal(null);
                }}
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
              >
                {customModal.type === 'alert' ? 'Sluiten' : 'Annuleren'}
              </button>
              
              {customModal.type !== 'alert' && (
                <button
                  type="button"
                  className={customModal.isDestructive ? 'btn-danger' : 'btn-primary'}
                  onClick={() => {
                    if (customModal.type === 'confirm') {
                      customModal.resolve(true);
                    } else if (customModal.type === 'prompt') {
                      customModal.resolve(dialogInput);
                    } else if (customModal.type === 'categoryForm') {
                      customModal.resolve({ name: dialogCategoryName, emoji: dialogCategoryEmoji });
                    }
                    setCustomModal(null);
                  }}
                  style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {customModal.isDestructive ? 'Verwijderen' : 'Bevestigen'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <span>✔️</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
