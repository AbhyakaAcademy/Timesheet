'use client'

import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const navItems = [
  { id: 'clients', label: 'Clients', icon: UsersIcon },
  { id: 'projects', label: 'Projects', icon: ProjectsIcon },
  { id: 'rates', label: 'Rates', icon: RatesIcon },
  { id: 'invoices', label: 'Invoices', icon: InvoicesIcon },
  { id: 'exports', label: 'Exports', icon: ExportsIcon }
]

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'

function getAccessToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('accessToken') || ''
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.detail || 'Request failed')
  }
  return data
}

function normalizeInvoice(invoice) {
  return {
    ...invoice,
    invoiceNumber: invoice.invoiceNumber || invoice.invoice_number,
    financialYear: invoice.financialYear || invoice.financial_year || '',
    clientName: invoice.clientName || invoice.client_name || '',
    clientGSTIN: invoice.clientGSTIN || invoice.client_gstin || '',
    clientAddress: invoice.clientAddress || invoice.client_address || '',
    clientState: invoice.clientState || invoice.client_state || '',
    invoiceDate: invoice.invoiceDate || invoice.issued_on || '',
    dueDate: invoice.dueDate || invoice.due_date || '',
    supplierName: invoice.supplierName || invoice.supplier_name || '',
    supplierGSTIN: invoice.supplierGSTIN || invoice.supplier_gstin || '',
    supplierAddress: invoice.supplierAddress || invoice.supplier_address || '',
    supplierState: invoice.supplierState || invoice.supplier_state || '',
    groupBy: invoice.groupBy || invoice.group_by || 'project',
    generatedFrom: invoice.generatedFrom || invoice.generated_from || { timeEntryIds: [], expenseIds: [] },
    total: Number(invoice.total || invoice.total_amount || 0),
    subtotal: Number(invoice.subtotal || 0),
    cgst: Number(invoice.cgst || 0),
    sgst: Number(invoice.sgst || 0),
    igst: Number(invoice.igst || 0),
    lineItems: (invoice.lineItems || invoice.line_items || []).map(item => ({
      ...item,
      sacHsn: item.sacHsn || item.sac_hsn || '',
      taxRate: Number(item.taxRate || item.tax_rate || 0),
      sourceType: item.sourceType || item.source_type || 'manual',
      sourceIds: item.sourceIds || item.source_ids || [],
      quantity: Number(item.quantity || 0),
      rate: Number(item.rate || 0),
      amount: Number(item.amount || 0)
    }))
  }
}

function normalizeExportJob(job) {
  const createdAt = job.created_at || job.createdAt || new Date().toISOString()
  return {
    id: String(job.id),
    reportName: job.title,
    reportType: job.title,
    format: job.format,
    exportedBy: 'Finance Admin',
    exportedAt: new Date(createdAt).toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }),
    timestamp: createdAt,
    fileSize: 'N/A',
    status: job.status === 'READY' ? 'Success' : job.status
  }
}

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState('clients')

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activeTab={activeTab} onSelect={setActiveTab} />
      <main className="flex-1 px-10 py-8">
        {activeTab === 'clients' && <ClientsSection />}
        {activeTab === 'projects' && <ProjectsSection />}
        {activeTab === 'rates' && <RatesSection />}
        {activeTab === 'invoices' && <InvoicesSection />}
        {activeTab === 'exports' && <ExportsSection />}
      </main>
      <HelpButton />
    </div>
  )
}

function Sidebar({ activeTab, onSelect }) {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="px-8 py-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold">Finance Admin</h2>
      </div>
      <nav className="px-4 py-6 flex-1 space-y-2 text-sm">
        {navItems.map(item => {
          const isActive = item.id === activeTab
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                isActive
                  ? 'bg-slate-100 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon active={isActive} />
              <span className="text-base">{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="px-6 py-6 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            FA
          </div>
          <div>
            <p className="text-sm font-semibold">Finance Admin</p>
            <p className="text-xs text-slate-500">admin@finance.com</p>
          </div>
        </div>
        <button className="mt-6 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <LogoutIcon />
          Logout
        </button>
      </div>
    </aside>
  )
}

function ClientsSection() {
  const [items, setItems] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [formValues, setFormValues] = useState({
    name: '',
    gstin: '',
    email: '',
    phone: '',
    address: '',
    state: ''
  })

  useEffect(() => {
    apiFetch('/finance/clients')
      .then(setItems)
      .catch(error => console.error('Failed to load clients', error))
  }, [])

  const openAddModal = () => {
    setEditingClient(null)
    setFormValues({
      name: '',
      gstin: '',
      email: '',
      phone: '',
      address: '',
      state: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = client => {
    setEditingClient(client)
    setOpenMenuId(null)
    setFormValues({
      name: client.name,
      gstin: client.gstin,
      email: client.email,
      phone: client.phone,
      address: client.address,
      state: client.state
    })
    setIsModalOpen(true)
  }

  const handleSave = async event => {
    event.preventDefault()
    if (editingClient) {
      const updated = await apiFetch(`/finance/clients/${editingClient.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formValues)
      })
      setItems(prev => prev.map(item => (item.id === editingClient.id ? updated : item)))
    } else {
      const created = await apiFetch('/finance/clients', {
        method: 'POST',
        body: JSON.stringify(formValues)
      })
      setItems(prev => [...prev, created])
    }
    setIsModalOpen(false)
  }

  const handleDelete = async clientId => {
    await apiFetch(`/finance/clients/${clientId}`, { method: 'DELETE' })
    setItems(prev => prev.filter(item => item.id !== clientId))
    setOpenMenuId(null)
  }

  const toggleMenu = clientId => {
    setOpenMenuId(prev => (prev === clientId ? null : clientId))
  }

  useEffect(() => {
    if (!openMenuId) return
    const handler = event => {
      const target = event.target
      if (target.closest('[data-client-menu]')) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  return (
    <SectionHeader
      title="Clients"
      subtitle="Manage your clients and their information"
      action="Add Client"
      onAction={openAddModal}
    >
      <SearchBar placeholder="Search clients by name or GSTIN..." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Client Name</th>
                <th className="px-5 py-3 font-semibold">GSTIN</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">State</th>
                <th className="px-5 py-3 font-semibold">Projects</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {items.map(client => (
                <tr key={client.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">{client.name}</td>
                  <td className="px-5 py-4 text-slate-700">{client.gstin}</td>
                  <td className="px-5 py-4">
                    <p className="text-slate-800">{client.email}</p>
                    <p className="text-slate-500">{client.phone}</p>
                  </td>
                  <td className="px-5 py-4">{client.state}</td>
                  <td className="px-5 py-4">{client.projects}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={client.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="relative inline-flex" data-client-menu>
                      <IconButton onClick={() => toggleMenu(client.id)}>
                        <DotsIcon />
                      </IconButton>
                      {openMenuId === client.id ? (
                        <div className="absolute right-0 top-11 w-36 rounded-xl border border-slate-200 bg-white py-2 text-left text-sm shadow-lg">
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                            onClick={() => openEditModal(client)}
                          >
                            Edit Client
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(client.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {isModalOpen ? (
        <ClientModal
          isEditing={Boolean(editingClient)}
          values={formValues}
          onChange={setFormValues}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
        />
      ) : null}
    </SectionHeader>
  )
}

function ProjectsSection() {
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    budgetHours: '',
    budgetAmount: '',
    alertThreshold: '80',
    tasks: []
  })
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskCode, setNewTaskCode] = useState('')

  useEffect(() => {
    apiFetch('/finance/projects')
      .then(setItems)
      .catch(error => console.error('Failed to load projects', error))
  }, [])

  const filteredProjects = items.filter(project => {
    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.client.toLowerCase().includes(query)
    )
  })

  const getBudgetStatus = project => {
    const hoursPercent = project.hours.total
      ? (project.hours.current / project.hours.total) * 100
      : 0
    const amountPercent = project.budget.total
      ? (project.budget.current / project.budget.total) * 100
      : 0
    const maxPercent = Math.max(hoursPercent, amountPercent)
    if (maxPercent >= project.alertThreshold) {
      return { status: 'warning', color: 'text-orange-500' }
    }
    return { status: 'normal', color: 'text-green-600' }
  }

  const openAddModal = () => {
    setEditingProject(null)
    setFormData({
      name: '',
      client: '',
      budgetHours: '',
      budgetAmount: '',
      alertThreshold: '80',
      tasks: []
    })
    setIsModalOpen(true)
  }

  const openEditModal = project => {
    setEditingProject(project)
    setOpenMenuId(null)
    setFormData({
      name: project.name,
      client: project.client,
      budgetHours: project.hours.total?.toString() || '',
      budgetAmount: project.budget.total?.toString() || '',
      alertThreshold: project.alertThreshold?.toString() || '80',
      tasks: project.tasks.map(task => ({ ...task }))
    })
    setIsModalOpen(true)
  }

  const handleAddTask = () => {
    if (!newTaskName.trim()) return
    const newTask = {
      name: newTaskName.trim(),
      code: newTaskCode.trim() || undefined
    }
    setFormData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }))
    setNewTaskName('')
    setNewTaskCode('')
  }

  const handleRemoveTask = index => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
  }

  const handleSaveProject = async event => {
    event.preventDefault()
    const payload = {
      name: formData.name,
      client: formData.client,
      budgetHours: formData.budgetHours,
      budgetAmount: formData.budgetAmount,
      alertThreshold: formData.alertThreshold,
      tasks: formData.tasks
    }
    if (editingProject) {
      const updated = await apiFetch(`/finance/projects/${editingProject.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
      setItems(prev =>
        prev.map(project => (project.id === editingProject.id ? updated : project))
      )
    } else {
      const created = await apiFetch('/finance/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      setItems(prev => [...prev, created])
    }
    setIsModalOpen(false)
    setEditingProject(null)
  }

  const handleDeleteProject = async projectId => {
    await apiFetch(`/finance/projects/${projectId}`, { method: 'DELETE' })
    setItems(prev => prev.filter(project => project.id !== projectId))
    setOpenMenuId(null)
  }

  const toggleMenu = projectName => {
    setOpenMenuId(prev => (prev === projectName ? null : projectName))
  }

  useEffect(() => {
    if (!openMenuId) return
    const handler = event => {
      const target = event.target
      if (target.closest('[data-project-menu]')) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  return (
    <SectionHeader
      title="Projects"
      subtitle="Manage projects, tasks, and budgets"
      action="Add Project"
      onAction={openAddModal}
    >
      <SearchBar
        placeholder="Search projects..."
        value={searchQuery}
        onChange={event => setSearchQuery(event.target.value)}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {filteredProjects.map(project => {
          const budgetStatus = getBudgetStatus(project)
          return (
            <Card key={project.name} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <p className="text-sm text-slate-500">{project.client}</p>
                </div>
                <div className="relative inline-flex" data-project-menu>
                  <IconButton onClick={() => toggleMenu(project.id)}>
                    <DotsIcon />
                  </IconButton>
                  {openMenuId === project.id ? (
                    <div className="absolute right-0 top-11 w-36 rounded-xl border border-slate-200 bg-white py-2 text-left text-sm shadow-lg">
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                            onClick={() => openEditModal(project)}
                          >
                            Edit Project
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            Delete
                          </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <StatusPill status={project.status} />
                {budgetStatus.status === 'warning' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                    <AlertIcon />
                    Alert
                  </span>
                ) : null}
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Hours</span>
                    <span className={budgetStatus.color}>
                      {project.hours.current} / {project.hours.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={(project.hours.current / project.hours.total) * 100}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Budget</span>
                    <span className={budgetStatus.color}>
                      {formatCurrency(project.budget.current)} /{' '}
                      {formatCurrency(project.budget.total)}
                    </span>
                  </div>
                  <ProgressBar
                    value={(project.budget.current / project.budget.total) * 100}
                  />
                </div>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-600">
                  Tasks ({project.tasks.length})
                </p>
                <ul className="mt-2 space-y-2 text-sm">
                  {project.tasks.map(task => (
                    <li key={task.code || task.name} className="flex justify-between">
                      <span>{task.name}</span>
                      {task.code ? (
                        <span className="text-slate-500">{task.code}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )
        })}
      </div>
      {isModalOpen ? (
        <ProjectModal
          isEditing={Boolean(editingProject)}
          values={formData}
          onChange={setFormData}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveProject}
          newTaskName={newTaskName}
          newTaskCode={newTaskCode}
          onTaskNameChange={setNewTaskName}
          onTaskCodeChange={setNewTaskCode}
          onAddTask={handleAddTask}
          onRemoveTask={handleRemoveTask}
        />
      ) : null}
    </SectionHeader>
  )
}

function RatesSection() {
  const [rateTab, setRateTab] = useState('project')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingType, setEditingType] = useState('project')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [projectRateItems, setProjectRateItems] = useState([])
  const [roleRateItems, setRoleRateItems] = useState([])
  const [employeeRateItems, setEmployeeRateItems] = useState([])
  const [projectFormData, setProjectFormData] = useState({
    projectName: '',
    hourlyRate: ''
  })
  const [roleFormData, setRoleFormData] = useState({
    roleName: '',
    hourlyRate: ''
  })
  const [employeeFormData, setEmployeeFormData] = useState({
    employeeName: '',
    projectName: '',
    hourlyRate: '',
    overridesRole: ''
  })

  useEffect(() => {
    Promise.all([
      apiFetch('/finance/rates/projects'),
      apiFetch('/finance/rates/roles'),
      apiFetch('/finance/rates/employees')
    ])
      .then(([projectRatesData, roleRatesData, employeeRatesData]) => {
        setProjectRateItems(projectRatesData)
        setRoleRateItems(roleRatesData)
        setEmployeeRateItems(employeeRatesData)
      })
      .catch(error => console.error('Failed to load rates', error))
  }, [])

  const filteredProjectRates = projectRateItems.filter(rate =>
    rate.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredRoleRates = roleRateItems.filter(rate =>
    rate.roleName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredEmployeeRates = employeeRateItems.filter(rate =>
    rate.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForms = () => {
    setProjectFormData({ projectName: '', hourlyRate: '' })
    setRoleFormData({ roleName: '', hourlyRate: '' })
    setEmployeeFormData({
      employeeName: '',
      projectName: '',
      hourlyRate: '',
      overridesRole: ''
    })
  }

  const openAddDialog = type => {
    setEditingType(type)
    setEditingItem(null)
    resetForms()
    setIsModalOpen(true)
  }

  const openEditDialog = (item, type) => {
    setEditingType(type)
    setEditingItem(item)
    setOpenMenuId(null)
    if (type === 'project') {
      setProjectFormData({
        projectName: item.projectName,
        hourlyRate: item.hourlyRate.toString()
      })
    } else if (type === 'role') {
      setRoleFormData({
        roleName: item.roleName,
        hourlyRate: item.hourlyRate.toString()
      })
    } else {
      setEmployeeFormData({
        employeeName: item.employeeName,
        projectName: item.projectName,
        hourlyRate: item.hourlyRate.toString(),
        overridesRole: item.overridesRole
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async event => {
    event.preventDefault()
    if (editingType === 'project') {
      if (editingItem) {
        const updated = await apiFetch(`/finance/rates/projects/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            projectName: projectFormData.projectName,
            hourlyRate: projectFormData.hourlyRate
          })
        })
        setProjectRateItems(prev =>
          prev.map(rate => (rate.id === editingItem.id ? updated : rate))
        )
      } else {
        const created = await apiFetch('/finance/rates/projects', {
          method: 'POST',
          body: JSON.stringify({
            projectName: projectFormData.projectName,
            hourlyRate: projectFormData.hourlyRate
          })
        })
        setProjectRateItems(prev => [...prev, created])
      }
    }

    if (editingType === 'role') {
      if (editingItem) {
        const updated = await apiFetch(`/finance/rates/roles/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            roleName: roleFormData.roleName,
            hourlyRate: roleFormData.hourlyRate
          })
        })
        setRoleRateItems(prev =>
          prev.map(rate => (rate.id === editingItem.id ? updated : rate))
        )
      } else {
        const created = await apiFetch('/finance/rates/roles', {
          method: 'POST',
          body: JSON.stringify({
            roleName: roleFormData.roleName,
            hourlyRate: roleFormData.hourlyRate
          })
        })
        setRoleRateItems(prev => [...prev, created])
      }
    }

    if (editingType === 'employee') {
      if (editingItem) {
        const updated = await apiFetch(`/finance/rates/employees/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(employeeFormData)
        })
        setEmployeeRateItems(prev =>
          prev.map(rate => (rate.id === editingItem.id ? updated : rate))
        )
      } else {
        const created = await apiFetch('/finance/rates/employees', {
          method: 'POST',
          body: JSON.stringify(employeeFormData)
        })
        setEmployeeRateItems(prev => [...prev, created])
      }
    }

    setIsModalOpen(false)
    setEditingItem(null)
    resetForms()
  }

  const handleDelete = async (id, type) => {
    if (type === 'project') {
      await apiFetch(`/finance/rates/projects/${id}`, { method: 'DELETE' })
      setProjectRateItems(prev => prev.filter(rate => rate.id !== id))
    } else if (type === 'role') {
      await apiFetch(`/finance/rates/roles/${id}`, { method: 'DELETE' })
      setRoleRateItems(prev => prev.filter(rate => rate.id !== id))
    } else {
      await apiFetch(`/finance/rates/employees/${id}`, { method: 'DELETE' })
      setEmployeeRateItems(prev => prev.filter(rate => rate.id !== id))
    }
    setOpenMenuId(null)
  }

  const toggleMenu = id => {
    setOpenMenuId(prev => (prev === id ? null : id))
  }

  useEffect(() => {
    if (!openMenuId) return
    const handler = event => {
      const target = event.target
      if (target.closest('[data-rate-menu]')) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  return (
    <SectionHeader
      title="Billing Rates"
      subtitle="Manage billing rates at project, role, and employee levels"
    >
      <SegmentTabs
        activeTab={rateTab}
        onSelect={setRateTab}
        tabs={[
          { id: 'project', label: 'Project Rates' },
          { id: 'role', label: 'Role Rates' },
          { id: 'employee', label: 'Employee Overrides' }
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <SearchBar
          placeholder={
            rateTab === 'role'
              ? 'Search roles...'
              : rateTab === 'employee'
              ? 'Search employees...'
              : 'Search projects...'
          }
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          className="flex-1 max-w-md"
        />
        <button
          className="bg-slate-950 text-white px-5 py-3 rounded-xl flex items-center gap-2"
          onClick={() => openAddDialog(rateTab)}
        >
          <PlusIcon />
          {rateTab === 'role'
            ? 'Add Role Rate'
            : rateTab === 'employee'
            ? 'Add Employee Override'
            : 'Add Project Rate'}
        </button>
      </div>

      {rateTab === 'project' ? (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Project Name</th>
                <th className="px-5 py-3 font-semibold">Hourly Rate</th>
                <th className="px-5 py-3 text-right font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {filteredProjectRates.map(rate => (
                <tr key={rate.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">{rate.projectName}</td>
                  <td className="px-5 py-4">
                    {formatCurrency(rate.hourlyRate)} / hour
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="relative inline-flex" data-rate-menu>
                      <IconButton onClick={() => toggleMenu(rate.id)}>
                        <DotsIcon />
                      </IconButton>
                      {openMenuId === rate.id ? (
                        <div className="absolute right-0 top-11 w-36 rounded-xl border border-slate-200 bg-white py-2 text-left text-sm shadow-lg">
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                            onClick={() => openEditDialog(rate, 'project')}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(rate.id, 'project')}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {rateTab === 'role' ? (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Role Name</th>
                <th className="px-5 py-3 font-semibold">Hourly Rate</th>
                <th className="px-5 py-3 text-right font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoleRates.map(rate => (
                <tr key={rate.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">{rate.roleName}</td>
                  <td className="px-5 py-4">
                    {formatCurrency(rate.hourlyRate)} / hour
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="relative inline-flex" data-rate-menu>
                      <IconButton onClick={() => toggleMenu(rate.id)}>
                        <DotsIcon />
                      </IconButton>
                      {openMenuId === rate.id ? (
                        <div className="absolute right-0 top-11 w-36 rounded-xl border border-slate-200 bg-white py-2 text-left text-sm shadow-lg">
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                            onClick={() => openEditDialog(rate, 'role')}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(rate.id, 'role')}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {rateTab === 'employee' ? (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Employee Name</th>
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-5 py-3 font-semibold">Overrides Role</th>
                <th className="px-5 py-3 font-semibold">Hourly Rate</th>
                <th className="px-5 py-3 text-right font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployeeRates.map(rate => (
                <tr key={rate.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">{rate.employeeName}</td>
                  <td className="px-5 py-4">{rate.projectName}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                      {rate.overridesRole}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {formatCurrency(rate.hourlyRate)} / hour
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="relative inline-flex" data-rate-menu>
                      <IconButton onClick={() => toggleMenu(rate.id)}>
                        <DotsIcon />
                      </IconButton>
                      {openMenuId === rate.id ? (
                        <div className="absolute right-0 top-11 w-36 rounded-xl border border-slate-200 bg-white py-2 text-left text-sm shadow-lg">
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                            onClick={() => openEditDialog(rate, 'employee')}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(rate.id, 'employee')}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {isModalOpen ? (
        <RateModal
          type={editingType}
          isEditing={Boolean(editingItem)}
          projectFormData={projectFormData}
          roleFormData={roleFormData}
          employeeFormData={employeeFormData}
          onProjectChange={setProjectFormData}
          onRoleChange={setRoleFormData}
          onEmployeeChange={setEmployeeFormData}
          onClose={() => {
            setIsModalOpen(false)
            setEditingItem(null)
            resetForms()
          }}
          onSubmit={handleSave}
        />
      ) : null}
    </SectionHeader>
  )
}

function InvoicesSection() {
  const [invoiceItems, setInvoiceItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState('select')
  const [selectedTimeEntries, setSelectedTimeEntries] = useState([])
  const [selectedExpenses, setSelectedExpenses] = useState([])
  const [formData, setFormData] = useState({
    clientName: '',
    clientGSTIN: '',
    clientAddress: '',
    clientState: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    groupBy: 'project',
    financialYear: '2025-26',
    supplierName: 'Your Company Name',
    supplierGSTIN: '29XYZAB5678C2D1',
    supplierAddress: '123 Business Street, Bangalore',
    supplierState: 'Karnataka'
  })
  const [activeInvoiceId, setActiveInvoiceId] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLineItemOpen, setIsLineItemOpen] = useState(false)
  const [editingLineItem, setEditingLineItem] = useState(null)
  const [lineItemForm, setLineItemForm] = useState({
    description: '',
    sacHsn: '',
    quantity: '',
    rate: '',
    taxRate: '18'
  })

  const [approvedEntries, setApprovedEntries] = useState([])
  const [approvedExpenseItems, setApprovedExpenseItems] = useState([])

  useEffect(() => {
    Promise.all([
      apiFetch('/finance/invoices'),
      apiFetch('/finance/approved-time-entries'),
      apiFetch('/finance/expenses')
    ])
      .then(([invoices, timeEntries, expenses]) => {
        setInvoiceItems(invoices.map(normalizeInvoice))
        setApprovedEntries(timeEntries.filter(entry => entry.approved && entry.billable))
        setApprovedExpenseItems(expenses.filter(expense => expense.approved && expense.billable))
      })
      .catch(error => console.error('Failed to load invoice data', error))
  }, [])

  const filteredInvoices = invoiceItems.filter(invoice => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: invoiceItems.length,
    paid: invoiceItems.filter(inv => inv.status === 'Paid').length,
    overdue: invoiceItems.filter(inv => inv.status === 'Overdue').length,
    draft: invoiceItems.filter(inv => inv.status === 'Draft').length,
    sent: invoiceItems.filter(inv => inv.status === 'Sent').length,
    totalAmount: invoiceItems.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: invoiceItems
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: invoiceItems
      .filter(inv => inv.status !== 'Paid' && inv.status !== 'Void')
      .reduce((sum, inv) => sum + inv.total, 0)
  }

  const activeInvoice = invoiceItems.find(invoice => invoice.id === activeInvoiceId)
  const isInterState =
    activeInvoice && activeInvoice.supplierState !== activeInvoice.clientState

  const resetCreateForm = () => {
    setCreateStep('select')
    setSelectedTimeEntries([])
    setSelectedExpenses([])
    setFormData({
      clientName: '',
      clientGSTIN: '',
      clientAddress: '',
      clientState: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      groupBy: 'project',
      financialYear: '2025-26',
      supplierName: 'Your Company Name',
      supplierGSTIN: '29XYZAB5678C2D1',
      supplierAddress: '123 Business Street, Bangalore',
      supplierState: 'Karnataka'
    })
  }

  const openCreateDialog = () => {
    resetCreateForm()
    setIsCreateOpen(true)
  }

  const handleStatusChange = async (invoiceId, newStatus) => {
    const updated = await apiFetch(`/finance/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    })
    setInvoiceItems(prev =>
      prev.map(invoice =>
        invoice.id === invoiceId ? normalizeInvoice(updated) : invoice
      )
    )
  }

  const handleTimeToggle = id => {
    setSelectedTimeEntries(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleExpenseToggle = id => {
    setSelectedExpenses(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const generateInvoiceNumber = financialYear => {
    const yearPrefix = financialYear.split('-')[0]
    const invoicesInYear = invoiceItems.filter(inv => inv.financialYear === financialYear)
    const nextNumber = invoicesInYear.length + 1
    return `INV-${yearPrefix}-${String(nextNumber).padStart(3, '0')}`
  }

  const calculateTotals = (lineItems, supplierState, clientState) => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = lineItems.reduce(
      (sum, item) => sum + item.amount * (item.taxRate / 100),
      0
    )
    const interstate = supplierState !== clientState
    const cgst = interstate ? 0 : taxAmount / 2
    const sgst = interstate ? 0 : taxAmount / 2
    const igst = interstate ? taxAmount : 0
    const total = subtotal + cgst + sgst + igst
    return { subtotal, cgst, sgst, igst, total }
  }

  const buildLineItems = () => {
    const selectedTime = approvedEntries.filter(entry =>
      selectedTimeEntries.includes(entry.id)
    )
    const selectedExp = approvedExpenseItems.filter(expense =>
      selectedExpenses.includes(expense.id)
    )
    const lineItems = []

    if (formData.groupBy === 'project') {
      const byProject = new Map()
      selectedTime.forEach(entry => {
        if (!byProject.has(entry.projectName)) {
          byProject.set(entry.projectName, [])
        }
        byProject.get(entry.projectName).push(entry)
      })
      byProject.forEach((entries, projectName) => {
        const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)
        const avgRate =
          entries.reduce((sum, entry) => sum + entry.rate, 0) / entries.length
        const amount = entries.reduce((sum, entry) => sum + entry.amount, 0)
        lineItems.push({
          id: `li-${Date.now()}-${projectName}`,
          description: `${projectName} - Development Services`,
          sacHsn: '998314',
          quantity: totalHours,
          rate: avgRate,
          taxRate: 18,
          amount,
          sourceType: 'time',
          sourceIds: entries.map(entry => entry.id)
        })
      })
      selectedExp.forEach(expense => {
        lineItems.push({
          id: `li-${Date.now()}-${expense.id}`,
          description: `${expense.projectName} - ${expense.description}`,
          sacHsn: '998314',
          quantity: 1,
          rate: expense.amount,
          taxRate: 18,
          amount: expense.amount,
          sourceType: 'expense',
          sourceIds: [expense.id]
        })
      })
    } else if (formData.groupBy === 'employee') {
      const byEmployee = new Map()
      selectedTime.forEach(entry => {
        if (!byEmployee.has(entry.employeeName)) {
          byEmployee.set(entry.employeeName, [])
        }
        byEmployee.get(entry.employeeName).push(entry)
      })
      byEmployee.forEach((entries, employeeName) => {
        const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)
        const avgRate =
          entries.reduce((sum, entry) => sum + entry.rate, 0) / entries.length
        const amount = entries.reduce((sum, entry) => sum + entry.amount, 0)
        lineItems.push({
          id: `li-${Date.now()}-${employeeName}`,
          description: `${employeeName} - Development Services`,
          sacHsn: '998314',
          quantity: totalHours,
          rate: avgRate,
          taxRate: 18,
          amount,
          sourceType: 'time',
          sourceIds: entries.map(entry => entry.id)
        })
      })
      selectedExp.forEach(expense => {
        lineItems.push({
          id: `li-${Date.now()}-${expense.id}`,
          description: `${expense.employeeName} - ${expense.description}`,
          sacHsn: '998314',
          quantity: 1,
          rate: expense.amount,
          taxRate: 18,
          amount: expense.amount,
          sourceType: 'expense',
          sourceIds: [expense.id]
        })
      })
    } else {
      selectedTime.forEach(entry => {
        lineItems.push({
          id: `li-${Date.now()}-${entry.id}`,
          description: `${entry.projectName} - ${entry.employeeName} - ${entry.taskName}`,
          sacHsn: '998314',
          quantity: entry.hours,
          rate: entry.rate,
          taxRate: 18,
          amount: entry.amount,
          sourceType: 'time',
          sourceIds: [entry.id]
        })
      })
      selectedExp.forEach(expense => {
        lineItems.push({
          id: `li-${Date.now()}-${expense.id}`,
          description: `${expense.projectName} - ${expense.employeeName} - ${expense.description}`,
          sacHsn: '998314',
          quantity: 1,
          rate: expense.amount,
          taxRate: 18,
          amount: expense.amount,
          sourceType: 'expense',
          sourceIds: [expense.id]
        })
      })
    }

    return lineItems
  }

  const handleCreateInvoice = async () => {
    const lineItems = buildLineItems()
    const created = await apiFetch('/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        status: 'Draft',
        generatedFrom: {
          timeEntryIds: selectedTimeEntries,
          expenseIds: selectedExpenses
        },
        lineItems
      })
    })
    setInvoiceItems(prev => [...prev, normalizeInvoice(created)])
    setIsCreateOpen(false)
    resetCreateForm()
  }

  const openInvoiceDetail = invoiceId => {
    setActiveInvoiceId(invoiceId)
    setIsDetailOpen(true)
  }

  const downloadInvoicePdf = invoice => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const isInterStateInvoice = invoice.supplierState !== invoice.clientState
    const formatPdfAmount = value => `INR ${new Intl.NumberFormat('en-IN').format(value)}`

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(20)
    doc.text('TAX INVOICE', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.text('Supplier Details', 14, 35)
    doc.setFontSize(9)
    doc.text(invoice.supplierName, 14, 41)
    doc.text(invoice.supplierAddress, 14, 46)
    doc.text(`GSTIN: ${invoice.supplierGSTIN}`, 14, 51)
    doc.text(`State: ${invoice.supplierState}`, 14, 56)

    doc.setFontSize(9)
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, pageWidth - 14, 35, {
      align: 'right'
    })
    doc.text(`FY: ${invoice.financialYear}`, pageWidth - 14, 41, {
      align: 'right'
    })
    doc.text(
      `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`,
      pageWidth - 14,
      46,
      { align: 'right' }
    )
    doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
      pageWidth - 14,
      51,
      { align: 'right' }
    )

    doc.setFontSize(10)
    doc.text('Bill To', 14, 66)
    doc.setFontSize(9)
    doc.text(invoice.clientName, 14, 72)
    doc.text(invoice.clientAddress, 14, 77)
    doc.text(`GSTIN: ${invoice.clientGSTIN}`, 14, 82)
    doc.text(`State: ${invoice.clientState}`, 14, 87)

    const tableData = invoice.lineItems.map(item => [
      item.description,
      item.sacHsn,
      item.quantity.toString(),
      formatPdfAmount(item.rate),
      `${item.taxRate}%`,
      formatPdfAmount(item.amount)
    ])

    autoTable(doc, {
      startY: 95,
      head: [['Description', 'SAC/HSN', 'Qty', 'Rate', 'GST', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 9, font: 'helvetica' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    })

    const finalY = doc.lastAutoTable?.finalY || 95
    const taxStartY = finalY + 10

    doc.setFontSize(10)
    doc.text('Subtotal:', pageWidth - 70, taxStartY)
    doc.text(formatPdfAmount(invoice.subtotal), pageWidth - 14, taxStartY, {
      align: 'right'
    })

    if (isInterStateInvoice) {
      doc.text('IGST (18%):', pageWidth - 70, taxStartY + 6)
      doc.text(formatPdfAmount(invoice.igst), pageWidth - 14, taxStartY + 6, {
        align: 'right'
      })
    } else {
      doc.text('CGST (9%):', pageWidth - 70, taxStartY + 6)
      doc.text(formatPdfAmount(invoice.cgst), pageWidth - 14, taxStartY + 6, {
        align: 'right'
      })
      doc.text('SGST (9%):', pageWidth - 70, taxStartY + 12)
      doc.text(formatPdfAmount(invoice.sgst), pageWidth - 14, taxStartY + 12, {
        align: 'right'
      })
    }

    doc.setLineWidth(0.5)
    doc.line(
      pageWidth - 70,
      taxStartY + (isInterStateInvoice ? 10 : 16),
      pageWidth - 14,
      taxStartY + (isInterStateInvoice ? 10 : 16)
    )

    doc.setFontSize(12)
    const totalY = taxStartY + (isInterStateInvoice ? 15 : 21)
    doc.text('Total:', pageWidth - 70, totalY)
    doc.text(formatPdfAmount(invoice.total), pageWidth - 14, totalY, {
      align: 'right'
    })

    doc.setFontSize(8)
    doc.text('Thank you for your business!', pageWidth / 2, 280, {
      align: 'center'
    })
    doc.text(
      `Generated from ${invoice.generatedFrom.timeEntryIds.length} time entries and ${invoice.generatedFrom.expenseIds.length} expenses`,
      pageWidth / 2,
      285,
      { align: 'center' }
    )

    doc.save(`${invoice.invoiceNumber}.pdf`)
  }

  const openLineItemModal = item => {
    if (item) {
      setEditingLineItem(item)
      setLineItemForm({
        description: item.description,
        sacHsn: item.sacHsn,
        quantity: String(item.quantity),
        rate: String(item.rate),
        taxRate: String(item.taxRate)
      })
    } else {
      setEditingLineItem(null)
      setLineItemForm({
        description: '',
        sacHsn: '',
        quantity: '',
        rate: '',
        taxRate: '18'
      })
    }
    setIsLineItemOpen(true)
  }

  const handleSaveLineItem = async () => {
    if (!activeInvoice) return
    const quantity = Number(lineItemForm.quantity) || 0
    const rate = Number(lineItemForm.rate) || 0
    const amount = quantity * rate
    const updatedItems = editingLineItem
      ? activeInvoice.lineItems.map(item =>
          item.id === editingLineItem.id
            ? {
                ...item,
                description: lineItemForm.description,
                sacHsn: lineItemForm.sacHsn,
                quantity,
                rate,
                taxRate: Number(lineItemForm.taxRate) || 0,
                amount
              }
            : item
        )
      : [
          ...activeInvoice.lineItems,
          {
            id: `li-${Date.now()}`,
            description: lineItemForm.description,
            sacHsn: lineItemForm.sacHsn,
            quantity,
            rate,
            taxRate: Number(lineItemForm.taxRate) || 0,
            amount,
            sourceType: 'manual',
            sourceIds: []
          }
        ]

    const updatedInvoice = await apiFetch(`/finance/invoices/${activeInvoice.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ lineItems: updatedItems })
    })
    setInvoiceItems(prev =>
      prev.map(invoice =>
        invoice.id === activeInvoice.id ? normalizeInvoice(updatedInvoice) : invoice
      )
    )
    setIsLineItemOpen(false)
    setEditingLineItem(null)
  }

  return (
    <SectionHeader
      title="Invoices"
      subtitle="Generate and manage GST-compliant invoices"
      action="Create Invoice"
      onAction={openCreateDialog}
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryCard title="Total Invoices" value={String(stats.total)} />
        <SummaryCard
          title="Paid"
          value={String(stats.paid)}
          valueColor="text-green-600"
          meta={formatCurrency(stats.paidAmount)}
        />
        <SummaryCard
          title="Pending"
          value={String(stats.sent + stats.draft)}
          valueColor="text-orange-500"
          meta={formatCurrency(stats.pendingAmount)}
        />
        <SummaryCard title="Overdue" value={String(stats.overdue)} valueColor="text-red-600" />
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchBar
            placeholder="Search by invoice number or client..."
            className="flex-1 bg-slate-50 border-transparent"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          <select
            className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 min-w-[160px]"
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Void">Void</option>
          </select>
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Invoice Number</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Due Date</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-mono">{invoice.invoiceNumber}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{invoice.clientName}</p>
                    <p className="text-xs text-slate-500">{invoice.clientGSTIN}</p>
                  </td>
                  <td className="px-5 py-4">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={invoice.status} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <IconButton onClick={() => openInvoiceDetail(invoice.id)}>
                      <EyeIcon />
                    </IconButton>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-center text-sm text-slate-500" colSpan={7}>
                    No invoices match your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Create New Invoice - Step{' '}
                  {createStep === 'select' ? '1' : createStep === 'configure' ? '2' : '3'} of 3
                </h2>
                <p className="text-sm text-slate-500">
                  {createStep === 'select' &&
                    'Select approved billable time entries and expenses.'}
                  {createStep === 'configure' &&
                    'Configure invoice details, GST, and grouping.'}
                  {createStep === 'review' && 'Review and finalize invoice.'}
                </p>
              </div>
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
                onClick={() => {
                  setIsCreateOpen(false)
                  resetCreateForm()
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {createStep === 'select' ? (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <CheckIcon />
                    Approved Billable Time Entries
                  </h3>
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3">
                    {approvedEntries.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No approved billable time entries available.
                      </p>
                    ) : (
                      approvedEntries.map(entry => (
                        <label
                          key={entry.id}
                          className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-blue-600"
                            checked={selectedTimeEntries.includes(entry.id)}
                            onChange={() => handleTimeToggle(entry.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              {entry.employeeName} - {entry.projectName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.taskName} - {entry.hours} hrs @{' '}
                              {formatCurrency(entry.rate)}/hr
                            </p>
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {formatCurrency(entry.amount)}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <CheckIcon />
                    Approved Billable Expenses
                  </h3>
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3">
                    {approvedExpenseItems.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No approved billable expenses available.
                      </p>
                    ) : (
                      approvedExpenseItems.map(expense => (
                        <label
                          key={expense.id}
                          className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-blue-600"
                            checked={selectedExpenses.includes(expense.id)}
                            onChange={() => handleExpenseToggle(expense.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              {expense.employeeName} - {expense.projectName}
                            </p>
                            <p className="text-xs text-slate-500">{expense.description}</p>
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {formatCurrency(expense.amount)}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                {(selectedTimeEntries.length > 0 || selectedExpenses.length > 0) && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    Selected {selectedTimeEntries.length} time entries and{' '}
                    {selectedExpenses.length} expenses.
                  </div>
                )}
              </div>
            ) : null}

            {createStep === 'configure' ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Financial Year
                    <select
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      value={formData.financialYear}
                      onChange={event =>
                        setFormData({ ...formData, financialYear: event.target.value })
                      }
                    >
                      <option value="2024-25">2024-25</option>
                      <option value="2025-26">2025-26</option>
                      <option value="2026-27">2026-27</option>
                    </select>
                    <span className="mt-2 block text-xs font-normal text-slate-500">
                      Invoice numbering follows FY rules.
                    </span>
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Group Line Items By
                    <select
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      value={formData.groupBy}
                      onChange={event =>
                        setFormData({ ...formData, groupBy: event.target.value })
                      }
                    >
                      <option value="project">Project/Task</option>
                      <option value="employee">Employee</option>
                      <option value="both">Project & Employee</option>
                    </select>
                  </label>
                </div>
                <ModalInput
                  label="Client Name"
                  value={formData.clientName}
                  onChange={value => setFormData({ ...formData, clientName: value })}
                  placeholder="Acme Corporation"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ModalInput
                    label="Client GSTIN"
                    value={formData.clientGSTIN}
                    onChange={value => setFormData({ ...formData, clientGSTIN: value })}
                    placeholder="29ABCDE1234F1Z5"
                  />
                  <ModalInput
                    label="Client State"
                    value={formData.clientState}
                    onChange={value => setFormData({ ...formData, clientState: value })}
                    placeholder="Karnataka"
                  />
                </div>
                <ModalInput
                  label="Client Address"
                  value={formData.clientAddress}
                  onChange={value => setFormData({ ...formData, clientAddress: value })}
                  placeholder="123 Business Park, Bangalore"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Invoice Date
                    <input
                      type="date"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      value={formData.invoiceDate}
                      onChange={event =>
                        setFormData({ ...formData, invoiceDate: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Due Date
                    <input
                      type="date"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      value={formData.dueDate}
                      onChange={event =>
                        setFormData({ ...formData, dueDate: event.target.value })
                      }
                    />
                  </label>
                </div>
                <Card className="p-4 bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-700">Supplier Details</h4>
                  <div className="mt-2 text-sm text-slate-600 space-y-1">
                    <p>{formData.supplierName}</p>
                    <p>{formData.supplierAddress}</p>
                    <p>GSTIN: {formData.supplierGSTIN}</p>
                    <p>State: {formData.supplierState}</p>
                  </div>
                </Card>
                {formData.clientState && formData.supplierState ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex gap-3">
                    <AlertCircleIcon />
                    <div>
                      <p className="font-semibold">GST Type</p>
                      <p>
                        {formData.clientState === formData.supplierState
                          ? 'Intrastate transaction - CGST & SGST apply.'
                          : 'Interstate transaction - IGST applies.'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {createStep === 'review' ? (
              <div className="mt-6 space-y-4">
                <Card className="p-4 bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-700">Invoice Summary</h4>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Invoice Number</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {generateInvoiceNumber(formData.financialYear)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Financial Year</span>
                      <span className="font-semibold text-slate-900">
                        {formData.financialYear}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client</span>
                      <span className="font-semibold text-slate-900">
                        {formData.clientName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client GSTIN</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formData.clientGSTIN}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grouping</span>
                      <span className="font-semibold text-slate-900 capitalize">
                        {formData.groupBy}
                      </span>
                    </div>
                  </div>
                </Card>
                {(() => {
                  const totals = calculateTotals(
                    buildLineItems(),
                    formData.supplierState,
                    formData.clientState
                  )
                  return (
                    <Card className="p-4 bg-slate-50">
                      <h4 className="text-sm font-semibold text-slate-700">
                        Amount Breakdown
                      </h4>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(totals.subtotal)}
                          </span>
                        </div>
                        {formData.supplierState === formData.clientState ? (
                          <>
                            <div className="flex justify-between">
                              <span>CGST</span>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(totals.cgst)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>SGST</span>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(totals.sgst)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span>IGST</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(totals.igst)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 pt-2">
                          <span className="font-semibold text-slate-900">Total</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(totals.total)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )
                })()}
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 flex gap-3">
                  <CheckIcon className="text-green-600" />
                  <div>
                    <p className="font-semibold">Ready to Create</p>
                    <p>
                      Invoice will be generated from {selectedTimeEntries.length} time
                      entries and {selectedExpenses.length} expenses. Status will be Draft.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              {createStep !== 'select' ? (
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                  onClick={() =>
                    setCreateStep(createStep === 'review' ? 'configure' : 'select')
                  }
                >
                  Previous
                </button>
              ) : null}
              <button
                type="button"
                className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                onClick={() => {
                  setIsCreateOpen(false)
                  resetCreateForm()
                }}
              >
                Cancel
              </button>
              {createStep !== 'review' ? (
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold"
                  onClick={() =>
                    setCreateStep(createStep === 'select' ? 'configure' : 'review')
                  }
                  disabled={
                    createStep === 'select' &&
                    selectedTimeEntries.length === 0 &&
                    selectedExpenses.length === 0
                  }
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold"
                  onClick={handleCreateInvoice}
                >
                  Create Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isDetailOpen && activeInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <button
                  className="text-sm text-slate-500 flex items-center gap-2"
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                >
                  <ArrowLeftIcon />
                  Back to invoices
                </button>
                <h2 className="mt-2 text-xl font-semibold">
                  {activeInvoice.invoiceNumber}
                </h2>
                <p className="text-sm text-slate-500">GST Tax Invoice</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                  onClick={() => downloadInvoicePdf(activeInvoice)}
                >
                  <DownloadIcon /> Download PDF
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold"
                  onClick={() => handleStatusChange(activeInvoice.id, 'Sent')}
                >
                  <SendIcon /> Send Invoice
                </button>
                <button
                  className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
                  onClick={() => setIsDetailOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <Card className="p-4 mt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Status</span>
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                    value={activeInvoice.status}
                    onChange={event => handleStatusChange(activeInvoice.id, event.target.value)}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
                <StatusPill status={activeInvoice.status} />
              </div>
            </Card>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-700">Supplier Details</h3>
                <div className="mt-3 text-sm text-slate-600 space-y-1">
                  <p className="font-semibold">{activeInvoice.supplierName}</p>
                  <p>{activeInvoice.supplierAddress}</p>
                  <p>GSTIN: {activeInvoice.supplierGSTIN}</p>
                  <p>State: {activeInvoice.supplierState}</p>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-700">Bill To</h3>
                <div className="mt-3 text-sm text-slate-600 space-y-1">
                  <p className="font-semibold">{activeInvoice.clientName}</p>
                  <p>{activeInvoice.clientAddress}</p>
                  <p>GSTIN: {activeInvoice.clientGSTIN}</p>
                  <p>State: {activeInvoice.clientState}</p>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-700">Invoice Info</h3>
                <div className="mt-3 text-sm text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Invoice Number</span>
                    <span className="font-mono font-semibold">
                      {activeInvoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invoice Date</span>
                    <span className="font-semibold">
                      {new Date(activeInvoice.invoiceDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date</span>
                    <span className="font-semibold">
                      {new Date(activeInvoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grouped By</span>
                    <span className="font-semibold capitalize">{activeInvoice.groupBy}</span>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-700">GST Information</h3>
                <div className="mt-3 text-sm text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Transaction Type</span>
                    <span className="font-semibold">
                      {isInterState ? 'Interstate (IGST)' : 'Intrastate (CGST/SGST)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supplier State</span>
                    <span className="font-semibold">{activeInvoice.supplierState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client State</span>
                    <span className="font-semibold">{activeInvoice.clientState}</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="mt-6">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700">Line Items</h3>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                  onClick={() => openLineItemModal(null)}
                >
                  <PlusIcon /> Add Item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Description</th>
                      <th className="px-5 py-3 font-semibold">SAC/HSN</th>
                      <th className="px-5 py-3 font-semibold text-right">Qty</th>
                      <th className="px-5 py-3 font-semibold text-right">Rate</th>
                      <th className="px-5 py-3 font-semibold text-right">GST</th>
                      <th className="px-5 py-3 font-semibold text-right">Amount</th>
                      <th className="px-5 py-3 font-semibold text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeInvoice.lineItems.map(item => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-semibold">{item.description}</td>
                        <td className="px-5 py-4 font-mono text-xs">{item.sacHsn}</td>
                        <td className="px-5 py-4 text-right">{item.quantity}</td>
                        <td className="px-5 py-4 text-right">
                          {formatCurrency(item.rate)}
                        </td>
                        <td className="px-5 py-4 text-right">{item.taxRate}%</td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            className="text-sm text-blue-600 font-semibold"
                            onClick={() => openLineItemModal(item)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="mt-6 p-5">
              <div className="max-w-md ml-auto space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(activeInvoice.subtotal)}</span>
                </div>
                {isInterState ? (
                  <div className="flex justify-between">
                    <span>IGST</span>
                    <span className="font-semibold">{formatCurrency(activeInvoice.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>CGST</span>
                      <span className="font-semibold">{formatCurrency(activeInvoice.cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST</span>
                      <span className="font-semibold">{formatCurrency(activeInvoice.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(activeInvoice.total)}</span>
                </div>
              </div>
            </Card>

            <Card className="mt-6 p-5">
              <h3 className="text-sm font-semibold text-slate-700">Terms & Conditions</h3>
              <div className="mt-3 text-sm text-slate-600 space-y-1">
                <p>1. Payment is due within 30 days of invoice date.</p>
                <p>2. Late payments may incur additional charges.</p>
                <p>3. All amounts are in INR.</p>
                <p>4. Computer-generated invoice, no signature required.</p>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {isLineItemOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingLineItem ? 'Edit Line Item' : 'Add Line Item'}
                </h2>
                <p className="text-sm text-slate-500">Update item details.</p>
              </div>
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
                onClick={() => setIsLineItemOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <ModalInput
                label="Description"
                value={lineItemForm.description}
                onChange={value => setLineItemForm({ ...lineItemForm, description: value })}
                placeholder="Development Services"
              />
              <ModalInput
                label="SAC/HSN"
                value={lineItemForm.sacHsn}
                onChange={value => setLineItemForm({ ...lineItemForm, sacHsn: value })}
                placeholder="998314"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <ModalInput
                  label="Quantity"
                  value={lineItemForm.quantity}
                  onChange={value => setLineItemForm({ ...lineItemForm, quantity: value })}
                  placeholder="1"
                />
                <ModalInput
                  label="Rate"
                  value={lineItemForm.rate}
                  onChange={value => setLineItemForm({ ...lineItemForm, rate: value })}
                  placeholder="2500"
                />
              </div>
              <ModalInput
                label="GST Rate (%)"
                value={lineItemForm.taxRate}
                onChange={value => setLineItemForm({ ...lineItemForm, taxRate: value })}
                placeholder="18"
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                onClick={() => setIsLineItemOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold"
                onClick={handleSaveLineItem}
              >
                {editingLineItem ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SectionHeader>
  )
}

function ExportsSection() {
  const [exportTab, setExportTab] = useState('billing')
  const [auditLogs, setAuditLogs] = useState([])
  const [invoiceItems, setInvoiceItems] = useState([])
  const [timeEntries, setTimeEntries] = useState([])
  const [exportError, setExportError] = useState('')

  const [billingConfig, setBillingConfig] = useState({
    format: 'Excel',
    dateFrom: '',
    dateTo: '',
    groupBy: 'project',
    includeGST: true
  })
  const [payrollConfig, setPayrollConfig] = useState({
    format: 'Excel',
    dateFrom: '',
    dateTo: '',
    groupBy: 'employee'
  })
  const [gstConfig, setGstConfig] = useState({
    format: 'Excel',
    dateFrom: '',
    dateTo: '',
    includeGST: true
  })
  const [timeEntriesConfig, setTimeEntriesConfig] = useState({
    format: 'CSV',
    dateFrom: '',
    dateTo: '',
    groupBy: 'project'
  })

  useEffect(() => {
    Promise.all([
      apiFetch('/finance/exports'),
      apiFetch('/finance/invoices'),
      apiFetch('/finance/approved-time-entries')
    ])
      .then(([exportsData, invoicesData, timeEntriesData]) => {
        setAuditLogs(exportsData.map(normalizeExportJob))
        setInvoiceItems(invoicesData.map(normalizeInvoice))
        setTimeEntries(timeEntriesData)
      })
      .catch(error => console.error('Failed to load export data', error))
  }, [])

  const buildCsv = (headers, rows) => {
    const lines = [headers.join(','), ...rows.map(row => row.join(','))]
    return lines.join('\n')
  }

  const downloadFile = (data, filename, type) => {
    const blob = new Blob([data], { type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportAsPdf = (title, headers, rows, filename) => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(16)
    doc.text(title, 14, 20)
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 9, font: 'helvetica' }
    })
    doc.save(filename)
  }

  const exportReport = async ({ title, headers, rows, format, fileBase, fileSize, rangeLabel }) => {
    const today = new Date().toISOString().split('T')[0]
    const extension = format.toLowerCase()
    const filename = `${fileBase}-${today}.${extension}`
    if (format === 'PDF') {
      exportAsPdf(title, headers, rows, filename)
    } else {
      const csvData = buildCsv(headers, rows)
      const mime =
        format === 'Excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      downloadFile(csvData, filename, mime)
    }
    const savedExport = await apiFetch('/finance/exports', {
      method: 'POST',
      body: JSON.stringify({
        title: `${title} - ${new Date().toLocaleDateString()}`,
        range: rangeLabel,
        format
      })
    })
    const normalized = normalizeExportJob(savedExport)
    normalized.fileSize = fileSize
    setAuditLogs(prev => [normalized, ...prev])
  }

  const validateExportConfig = (config, label) => {
    if (!config.dateFrom || !config.dateTo) {
      setExportError(`Please enter From Date and To Date before generating the ${label}.`)
      return false
    }

    if (config.dateTo < config.dateFrom) {
      setExportError(`To Date cannot be earlier than From Date for the ${label}.`)
      return false
    }

    setExportError('')
    return true
  }

  const filterInvoicesByDate = config =>
    invoiceItems.filter(invoice => {
      if (!invoice.invoiceDate) return false
      return invoice.invoiceDate >= config.dateFrom && invoice.invoiceDate <= config.dateTo
    })

  const filterTimeEntriesByDate = config =>
    timeEntries.filter(entry => entry.date >= config.dateFrom && entry.date <= config.dateTo)

  const handleExportBilling = async () => {
    if (!validateExportConfig(billingConfig, 'Billing Report')) return
    const filteredInvoices = filterInvoicesByDate(billingConfig)
    if (filteredInvoices.length === 0) {
      setExportError('No billing data found for the selected date range.')
      return
    }
    const headers = ['Invoice Number', 'Client Name', 'Project', 'Date', 'Amount', 'GST', 'Total', 'Status']
    const rows = filteredInvoices.map(invoice => [
      invoice.invoiceNumber,
      invoice.clientName,
      invoice.groupBy,
      invoice.invoiceDate,
      String(invoice.subtotal),
      String(invoice.cgst + invoice.sgst + invoice.igst),
      String(invoice.total),
      invoice.status
    ])
    await exportReport({
      title: 'Billing Report',
      headers,
      rows,
      format: billingConfig.format,
      fileBase: 'billing-report',
      fileSize: '245 KB',
      rangeLabel: `${billingConfig.dateFrom || 'Start'} - ${billingConfig.dateTo || 'Today'}`
    })
  }

  const handleExportPayroll = async () => {
    if (!validateExportConfig(payrollConfig, 'Payroll Report')) return
    const filteredEntries = filterTimeEntriesByDate(payrollConfig)
    if (filteredEntries.length === 0) {
      setExportError('No payroll data found for the selected date range.')
      return
    }
    const headers = ['Employee Name', 'Role', 'Hours Worked', 'Hourly Rate', 'Gross Pay', 'Deductions', 'Net Pay']
    const payrollSummary = Array.from(
      filteredEntries.reduce((map, entry) => {
        const key = entry.employeeName
        const current = map.get(key) || { employee: key, hours: 0, rate: Number(entry.rate || 0), amount: 0 }
        current.hours += Number(entry.hours || 0)
        current.amount += Number(entry.amount || 0)
        current.rate = Number(entry.rate || current.rate || 0)
        map.set(key, current)
        return map
      }, new Map()).values()
    )
    const rows = payrollSummary.map(item => [
      item.employee,
      '-',
      String(item.hours),
      String(item.rate),
      String(item.amount),
      String(Math.round(item.amount * 0.1)),
      String(Math.round(item.amount * 0.9))
    ])
    await exportReport({
      title: 'Payroll Report',
      headers,
      rows,
      format: payrollConfig.format,
      fileBase: 'payroll-report',
      fileSize: '180 KB',
      rangeLabel: `${payrollConfig.dateFrom || 'Start'} - ${payrollConfig.dateTo || 'Today'}`
    })
  }

  const handleExportGST = async () => {
    if (!validateExportConfig(gstConfig, 'GST Report')) return
    const filteredInvoices = filterInvoicesByDate(gstConfig)
    if (filteredInvoices.length === 0) {
      setExportError('No GST data found for the selected date range.')
      return
    }
    const headers = [
      'Invoice Number',
      'GSTIN',
      'Client State',
      'Supplier State',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total Tax',
      'Invoice Total'
    ]
    const rows = filteredInvoices.map(invoice => [
      invoice.invoiceNumber,
      invoice.clientGSTIN,
      invoice.clientState,
      invoice.supplierState,
      String(invoice.subtotal),
      String(invoice.cgst),
      String(invoice.sgst),
      String(invoice.igst),
      String(invoice.cgst + invoice.sgst + invoice.igst),
      String(invoice.total)
    ])
    await exportReport({
      title: 'GST Report',
      headers,
      rows,
      format: gstConfig.format,
      fileBase: 'gst-report',
      fileSize: '95 KB',
      rangeLabel: `${gstConfig.dateFrom || 'Start'} - ${gstConfig.dateTo || 'Today'}`
    })
  }

  const handleExportTimeEntries = async () => {
    if (!validateExportConfig(timeEntriesConfig, 'Time Entries Report')) return
    const filteredEntries = filterTimeEntriesByDate(timeEntriesConfig)
    if (filteredEntries.length === 0) {
      setExportError('No time entries found for the selected date range.')
      return
    }
    const headers = ['Date', 'Employee', 'Project', 'Task', 'Hours', 'Billable', 'Rate', 'Amount']
    const rows = filteredEntries.map(entry => [
      entry.date,
      entry.employeeName,
      entry.projectName,
      entry.taskName,
      String(entry.hours),
      entry.billable ? 'Yes' : 'No',
      String(entry.rate),
      String(entry.amount)
    ])
    await exportReport({
      title: 'Time Entries Report',
      headers,
      rows,
      format: timeEntriesConfig.format,
      fileBase: 'time-entries',
      fileSize: '310 KB',
      rangeLabel: `${timeEntriesConfig.dateFrom || 'Start'} - ${timeEntriesConfig.dateTo || 'Today'}`
    })
  }

  const formInputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700'

  return (
    <SectionHeader
      title="Exports & Reports"
      subtitle="Generate and download payroll, billing, and GST reports"
    >
      <SegmentTabs
        activeTab={exportTab}
        onSelect={tab => {
          setExportTab(tab)
          setExportError('')
        }}
        tabs={[
          { id: 'billing', label: 'Billing Report' },
          { id: 'payroll', label: 'Payroll Report' },
          { id: 'gst', label: 'GST Report' },
          { id: 'time', label: 'Time Entries' }
        ]}
      />

      {exportError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {exportError}
        </div>
      ) : null}

      {exportTab === 'billing' ? (
        <Card className="p-6">
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ReportIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Billing Report</h3>
              <p className="text-sm text-slate-500">
                Export invoice data with optional GST breakdown
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              From Date
              <input
                className={formInputClass}
                type="date"
                value={billingConfig.dateFrom}
                onChange={event =>
                  setBillingConfig({ ...billingConfig, dateFrom: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              To Date
              <input
                className={formInputClass}
                type="date"
                value={billingConfig.dateTo}
                onChange={event =>
                  setBillingConfig({ ...billingConfig, dateTo: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Group By
              <select
                className={formInputClass}
                value={billingConfig.groupBy}
                onChange={event =>
                  setBillingConfig({ ...billingConfig, groupBy: event.target.value })
                }
              >
                <option value="project">Project</option>
                <option value="client">Client</option>
                <option value="month">Month</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Export Format
              <select
                className={formInputClass}
                value={billingConfig.format}
                onChange={event =>
                  setBillingConfig({ ...billingConfig, format: event.target.value })
                }
              >
                <option value="CSV">CSV</option>
                <option value="Excel">Excel</option>
                <option value="PDF">PDF</option>
              </select>
            </label>
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={billingConfig.includeGST}
              onChange={event =>
                setBillingConfig({ ...billingConfig, includeGST: event.target.checked })
              }
              className="h-4 w-4 accent-blue-600"
            />
            Include GST breakdown
          </label>
          <button
            type="button"
            onClick={handleExportBilling}
            className="mt-6 w-full bg-slate-950 text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <DownloadIcon />
            Generate Billing Report
          </button>
        </Card>
      ) : null}

      {exportTab === 'payroll' ? (
        <Card className="p-6">
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ReportIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payroll Report</h3>
              <p className="text-sm text-slate-500">
                Export employee hours and payment data
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              From Date
              <input
                className={formInputClass}
                type="date"
                value={payrollConfig.dateFrom}
                onChange={event =>
                  setPayrollConfig({ ...payrollConfig, dateFrom: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              To Date
              <input
                className={formInputClass}
                type="date"
                value={payrollConfig.dateTo}
                onChange={event =>
                  setPayrollConfig({ ...payrollConfig, dateTo: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Group By
              <select
                className={formInputClass}
                value={payrollConfig.groupBy}
                onChange={event =>
                  setPayrollConfig({ ...payrollConfig, groupBy: event.target.value })
                }
              >
                <option value="employee">Employee</option>
                <option value="department">Department</option>
                <option value="role">Role</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Export Format
              <select
                className={formInputClass}
                value={payrollConfig.format}
                onChange={event =>
                  setPayrollConfig({ ...payrollConfig, format: event.target.value })
                }
              >
                <option value="CSV">CSV</option>
                <option value="Excel">Excel</option>
                <option value="PDF">PDF</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={handleExportPayroll}
            className="mt-6 w-full bg-slate-950 text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <DownloadIcon />
            Generate Payroll Report
          </button>
        </Card>
      ) : null}

      {exportTab === 'gst' ? (
        <Card className="p-6">
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ReportIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold">GST Report</h3>
              <p className="text-sm text-slate-500">
                Export GST-compliant tax reports for filing
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              From Date
              <input
                className={formInputClass}
                type="date"
                value={gstConfig.dateFrom}
                onChange={event =>
                  setGstConfig({ ...gstConfig, dateFrom: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              To Date
              <input
                className={formInputClass}
                type="date"
                value={gstConfig.dateTo}
                onChange={event =>
                  setGstConfig({ ...gstConfig, dateTo: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Export Format
              <select
                className={formInputClass}
                value={gstConfig.format}
                onChange={event =>
                  setGstConfig({ ...gstConfig, format: event.target.value })
                }
              >
                <option value="CSV">CSV</option>
                <option value="Excel">Excel</option>
                <option value="PDF">PDF</option>
              </select>
            </label>
          </div>
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            This report includes GSTIN, invoice particulars, taxable value, CGST/SGST/IGST
            breakup, and SAC/HSN codes as required for GST filing.
          </div>
          <button
            type="button"
            onClick={handleExportGST}
            className="mt-6 w-full bg-slate-950 text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <DownloadIcon />
            Generate GST Report
          </button>
        </Card>
      ) : null}

      {exportTab === 'time' ? (
        <Card className="p-6">
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
            <div className="h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ReportIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Time Entries Report</h3>
              <p className="text-sm text-slate-500">
                Export detailed time entry records
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              From Date
              <input
                className={formInputClass}
                type="date"
                value={timeEntriesConfig.dateFrom}
                onChange={event =>
                  setTimeEntriesConfig({
                    ...timeEntriesConfig,
                    dateFrom: event.target.value
                  })
                }
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              To Date
              <input
                className={formInputClass}
                type="date"
                value={timeEntriesConfig.dateTo}
                onChange={event =>
                  setTimeEntriesConfig({
                    ...timeEntriesConfig,
                    dateTo: event.target.value
                  })
                }
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Group By
              <select
                className={formInputClass}
                value={timeEntriesConfig.groupBy}
                onChange={event =>
                  setTimeEntriesConfig({
                    ...timeEntriesConfig,
                    groupBy: event.target.value
                  })
                }
              >
                <option value="project">Project</option>
                <option value="employee">Employee</option>
                <option value="task">Task</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Export Format
              <select
                className={formInputClass}
                value={timeEntriesConfig.format}
                onChange={event =>
                  setTimeEntriesConfig({
                    ...timeEntriesConfig,
                    format: event.target.value
                  })
                }
              >
                <option value="CSV">CSV</option>
                <option value="Excel">Excel</option>
                <option value="PDF">PDF</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={handleExportTimeEntries}
            className="mt-6 w-full bg-slate-950 text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <DownloadIcon />
            Generate Time Entries Report
          </button>
        </Card>
      ) : null}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ReportIcon />
            <h3 className="font-semibold text-slate-900">Export Audit Log</h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full border border-slate-200 text-slate-600">
            {auditLogs.length} records
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Complete history of all exports with timestamps, user details, and export types
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Report Name</th>
                <th className="px-5 py-3 font-semibold">Report Type</th>
                <th className="px-5 py-3 font-semibold">Format</th>
                <th className="px-5 py-3 font-semibold">Exported By</th>
                <th className="px-5 py-3 font-semibold">Export Timestamp</th>
                <th className="px-5 py-3 font-semibold">File Size</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">{log.reportName}</td>
                  <td className="px-5 py-4">{log.reportType}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">
                      {log.format}
                    </span>
                  </td>
                  <td className="px-5 py-4">{log.exportedBy}</td>
                  <td className="px-5 py-4 font-mono text-xs">{log.exportedAt}</td>
                  <td className="px-5 py-4">{log.fileSize}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.status === 'Success'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </SectionHeader>
  )
}

function SectionHeader({ title, subtitle, action, onAction, children }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-slate-500">{subtitle}</p>
        </div>
        {action ? (
          <button
            className="bg-slate-950 text-white px-5 py-3 rounded-xl flex items-center gap-2"
            onClick={onAction}
            type="button"
          >
            <PlusIcon />
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function SearchBar({ placeholder, className = '', value, onChange }) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 ${className}`}>
      <SearchIcon />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full text-sm text-slate-700 placeholder:text-slate-400 outline-none"
      />
    </div>
  )
}

function SegmentTabs({ tabs, activeTab, onSelect }) {
  return (
    <div className="bg-slate-100 rounded-full p-1 flex flex-wrap gap-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === tab.id ? 'bg-white shadow text-slate-900' : 'text-slate-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function StatusPill({ status }) {
  const palette = {
    Active: 'bg-slate-900 text-white',
    Sent: 'bg-slate-900 text-white',
    Paid: 'bg-slate-900 text-white',
    Overdue: 'bg-rose-600 text-white',
    Draft: 'bg-slate-200 text-slate-700',
    'Partially Paid': 'bg-amber-500 text-white',
    Void: 'bg-slate-300 text-slate-700'
  }
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        palette[status] || 'bg-slate-200 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}

function ProgressBar({ value }) {
  return (
    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
      <div className="h-full bg-slate-900" style={{ width: `${value}%` }} />
    </div>
  )
}

function SummaryCard({ title, value, meta, valueColor = 'text-slate-900' }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>{value}</p>
      {meta ? <p className="mt-2 text-sm text-slate-500">{meta}</p> : null}
    </Card>
  )
}

function FilterSelect({ label }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold">
      {label}
      <ChevronDownIcon />
    </div>
  )
}

function InputField({ label, placeholder }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
        {placeholder}
      </div>
    </div>
  )
}

function SelectField({ label, value }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <div className="mt-2 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold">
        {value}
        <ChevronDownIcon />
      </div>
    </div>
  )
}

function InfoBanner() {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-700 flex items-start gap-3">
      <div className="mt-1">
        <TrendIcon />
      </div>
      <div>
        <p className="font-semibold text-blue-800">Rate Hierarchy</p>
        <p>
          Employee rates override role rates, which override project rates. This allows
          flexible billing structures for different scenarios.
        </p>
      </div>
    </div>
  )
}

function IconButton({ children, onClick }) {
  return (
    <button
      className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function ClientModal({ isEditing, values, onChange, onClose, onSubmit }) {
  const updateField = (key, value) => onChange(prev => ({ ...prev, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Client' : 'Add New Client'}
            </h2>
            <p className="text-sm text-slate-500">
              Enter client details to add them to your system
            </p>
          </div>
          <button
            type="button"
            className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <ModalInput
            label="Client Name"
            value={values.name}
            onChange={value => updateField('name', value)}
            placeholder="Acme Corporation"
          />
          <ModalInput
            label="GSTIN"
            value={values.gstin}
            onChange={value => updateField('gstin', value)}
            placeholder="29ABCDE1234F1Z5"
          />
          <ModalInput
            label="Email"
            value={values.email}
            onChange={value => updateField('email', value)}
            placeholder="contact@example.com"
          />
          <ModalInput
            label="Phone"
            value={values.phone}
            onChange={value => updateField('phone', value)}
            placeholder="+91 98765 43210"
          />
          <ModalInput
            label="Address"
            value={values.address}
            onChange={value => updateField('address', value)}
            placeholder="123 Business Park"
          />
          <ModalInput
            label="State"
            value={values.state}
            onChange={value => updateField('state', value)}
            placeholder="Karnataka"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold"
            >
              {isEditing ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

function ProjectModal({
  isEditing,
  values,
  onChange,
  onClose,
  onSubmit,
  newTaskName,
  newTaskCode,
  onTaskNameChange,
  onTaskCodeChange,
  onAddTask,
  onRemoveTask
}) {
  const updateField = (key, value) => onChange(prev => ({ ...prev, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Project' : 'Add New Project'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing
                ? 'Update project information, budget, and tasks'
                : 'Enter project details, budget, and tasks'}
            </p>
          </div>
          <button
            type="button"
            className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <form className="mt-6 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            <ModalInput
              label="Project Name"
              value={values.name}
              onChange={value => updateField('name', value)}
              placeholder="Website Redesign"
            />
            <ModalInput
              label="Client Name"
              value={values.client}
              onChange={value => updateField('client', value)}
              placeholder="Acme Corporation"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <ModalInput
                label="Budget Hours (optional)"
                value={values.budgetHours}
                onChange={value => updateField('budgetHours', value)}
                placeholder="200"
              />
              <ModalInput
                label="Budget Amount ₹ (optional)"
                value={values.budgetAmount}
                onChange={value => updateField('budgetAmount', value)}
                placeholder="500000"
              />
            </div>
            <ModalInput
              label="Budget Alert Threshold (%)"
              value={values.alertThreshold}
              onChange={value => updateField('alertThreshold', value)}
              placeholder="80"
            />
            <p className="text-xs text-slate-500">
              Alert will be shown when budget usage exceeds this percentage.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-6">
            <p className="text-sm font-semibold text-slate-700">
              Tasks & Cost Codes
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="flex-1 min-w-[220px]">
                <ModalInput
                  label="Task Name"
                  value={newTaskName}
                  onChange={onTaskNameChange}
                  placeholder="UI/UX Design"
                />
              </div>
              <div className="w-40">
                <ModalInput
                  label="Cost Code"
                  value={newTaskCode}
                  onChange={onTaskCodeChange}
                  placeholder="DES-001"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  className="h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                  onClick={onAddTask}
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {values.tasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No tasks added yet
                </p>
              ) : (
                values.tasks.map((task, index) => (
                  <div
                    key={`${task.name}-${index}`}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {task.name}
                      </p>
                      {task.code ? (
                        <p className="text-xs text-slate-500">{task.code}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="text-rose-600 text-sm font-semibold"
                      onClick={() => onRemoveTask(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold"
            >
              {isEditing ? 'Update Project' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RateModal({
  type,
  isEditing,
  projectFormData,
  roleFormData,
  employeeFormData,
  onProjectChange,
  onRoleChange,
  onEmployeeChange,
  onClose,
  onSubmit
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit' : 'Add'}{' '}
              {type === 'project'
                ? 'Project Rate'
                : type === 'role'
                ? 'Role Rate'
                : 'Employee Override'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing ? 'Update' : 'Enter'} billing rate information
            </p>
          </div>
          <button
            type="button"
            className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {type === 'project' ? (
            <>
              <ModalInput
                label="Project Name"
                value={projectFormData.projectName}
                onChange={value =>
                  onProjectChange(prev => ({ ...prev, projectName: value }))
                }
                placeholder="Website Redesign"
              />
              <ModalInput
                label="Hourly Rate (₹)"
                value={projectFormData.hourlyRate}
                onChange={value =>
                  onProjectChange(prev => ({ ...prev, hourlyRate: value }))
                }
                placeholder="2500"
              />
            </>
          ) : null}

          {type === 'role' ? (
            <>
              <ModalInput
                label="Role Name"
                value={roleFormData.roleName}
                onChange={value =>
                  onRoleChange(prev => ({ ...prev, roleName: value }))
                }
                placeholder="Senior Developer"
              />
              <ModalInput
                label="Hourly Rate (₹)"
                value={roleFormData.hourlyRate}
                onChange={value =>
                  onRoleChange(prev => ({ ...prev, hourlyRate: value }))
                }
                placeholder="3000"
              />
            </>
          ) : null}

          {type === 'employee' ? (
            <>
              <ModalInput
                label="Employee Name"
                value={employeeFormData.employeeName}
                onChange={value =>
                  onEmployeeChange(prev => ({ ...prev, employeeName: value }))
                }
                placeholder="Rahul Sharma"
              />
              <ModalInput
                label="Project Name"
                value={employeeFormData.projectName}
                onChange={value =>
                  onEmployeeChange(prev => ({ ...prev, projectName: value }))
                }
                placeholder="Website Redesign"
              />
              <ModalInput
                label="Overrides Role"
                value={employeeFormData.overridesRole}
                onChange={value =>
                  onEmployeeChange(prev => ({ ...prev, overridesRole: value }))
                }
                placeholder="Senior Developer"
              />
              <ModalInput
                label="Hourly Rate (₹)"
                value={employeeFormData.hourlyRate}
                onChange={value =>
                  onEmployeeChange(prev => ({ ...prev, hourlyRate: value }))
                }
                placeholder="3200"
              />
            </>
          ) : null}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold"
            >
              {isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function HelpButton() {
  return (
    <button className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg">
      ?
    </button>
  )
}

function formatCurrency(value) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  })
  return formatter.format(value)
}

function UsersIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 20a6 6 0 0 1 12 0"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 8a3 3 0 1 0 0-6"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 14c3.314 0 6 2.239 6 5"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ProjectsIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
      />
      <path
        d="M7 8h4"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 12h10"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RatesIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v18M18 7c0-2.21-2.686-4-6-4S6 4.79 6 7c0 4 12 2 12 6 0 2.21-2.686 4-6 4s-6-1.79-6-4"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function InvoicesIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h7l5 5v13H7V3Z"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v6h6"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ExportsIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={active ? '#2563eb' : '#64748b'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
        stroke="#64748b"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="#64748b"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="1.8" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="#94a3b8"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2" fill="#94a3b8" />
      <circle cx="12" cy="12" r="2" fill="#94a3b8" />
      <circle cx="12" cy="19" r="2" fill="#94a3b8" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        stroke="#94a3b8"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="#94a3b8" strokeWidth="1.8" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M6 18L18 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon({ className = '' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="1.8" />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="#16a34a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AlertCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#2563eb" strokeWidth="1.8" />
      <path
        d="M12 8v5M12 16h.01"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="#64748b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 2 11 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2 15 22l-4-9-9-4 20-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4v10m0 0 4-4m-4 4-4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 18v2h16v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 16l6-6 4 4 6-8"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 6h4v4"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h7l5 5v13H7V3Z"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v6h6"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 13h6M9 17h6"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 9v4m0 4h.01M10.29 4.86l-7 12a2 2 0 0 0 1.71 3h14a2 2 0 0 0 1.71-3l-7-12a2 2 0 0 0-3.42 0Z"
        stroke="#e11d48"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


