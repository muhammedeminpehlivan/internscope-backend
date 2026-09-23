import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { companyService } from '../services/companyService'
import { internshipService } from '../services/internshipService'
import { lookupService } from '../services/lookupService'
import { userService } from '../services/userService'
import apiClient from '../services/apiClient'

function splitStoredNotes(notes?: string) {
  if (!notes) return { experiences: '', suggestions: '' }

  const experienceMarker = 'Deneyim:\n'
  const suggestionMarker = '\n\nEk öneri:\n'
  const experienceStart = notes.indexOf(experienceMarker)
  const suggestionStart = notes.indexOf(suggestionMarker)

  if (experienceStart >= 0 || suggestionStart >= 0) {
    const experiences = experienceStart >= 0
      ? notes.slice(experienceStart + experienceMarker.length, suggestionStart >= 0 ? suggestionStart : undefined)
      : ''
    const suggestions = suggestionStart >= 0
      ? notes.slice(suggestionStart + suggestionMarker.length)
      : ''
    return { experiences, suggestions }
  }

  return { experiences: '', suggestions: notes }
}

function getResponseItems(response: any) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.items)) return response.data.items
  if (Array.isArray(response?.items)) return response.items
  return []
}

export default function InternshipFormPage() {
  const { id: internshipId } = useParams<{ id: string }>()
  const isEditing = !!internshipId

  const [companies, setCompanies] = useState<any[]>([])
  const [universities, setUniversities] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])

  const [formData, setFormData] = useState({
    companyName: '',
    university: '',
    universityId: '',
    department: '',
    departmentId: '',
    city: '',
    cityId: '',
    internshipType: 'uzun',
    grade: '3. Sınıf',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    recommendBasic: 'yes',
    learningScore: '4',
    mentorScore: '4',
    techScore: '5',
    environmentScore: '4',
    compScore: '3',
    recommendDetail: 'yes',
    suggestions: '',
    experiences: '',
    appliedVia: 'LinkedIn',
    interviewProcess: '',
    sgkCode: '',
    returnOfferReceived: 'no',
    isAnonymous: false
  })

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEditing)
  const [companyInputValue, setCompanyInputValue] = useState('')
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([])
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, universitiesRes, departmentsRes, citiesRes, internshipsRes, changesRes, userRes] = await Promise.all([
          companyService.getAll(),
          lookupService.getUniversities(),
          lookupService.getDepartments(),
          lookupService.getCities(),
          isEditing ? internshipService.getMine() : Promise.resolve({ data: [] }),
          isEditing ? apiClient.get('/admin/pending-changes').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          userService.getCurrentUser().catch(() => ({ data: null }))
        ])

        const unisList = universitiesRes.data || []
        const deptsList = departmentsRes.data || []
        const citiesList = citiesRes.data || []

        setCompanies(companiesRes.data || [])
        setUniversities(unisList)
        setDepartments(deptsList)
        setCities(citiesList)


        if (isEditing && internshipId && internshipsRes.data && Array.isArray(internshipsRes.data)) {
          let data = internshipsRes.data.find((item: any) => item.id === internshipId)

          // Pending-changes'te güncel proposed veri varsa onu kullan
          const pendingChanges = getResponseItems(changesRes)
          if (data && pendingChanges.length > 0) {
            const pendingChange = pendingChanges.find((change: any) => {
              const currentId = change.current?.id || change.current?.internshipId || change.internshipId || change.id
              return String(currentId) === String(internshipId)
            })
            if (pendingChange && Object.keys(pendingChange.proposed || {}).length > 0) {
              data = { ...data, ...pendingChange.proposed }
            }
          }

          if (data) {
            const storedNotes = splitStoredNotes(data.scores?.additionalTips)
            // Proposed'da ID varsa ID ile match et, yoksa name ile match et
            const matchedUniversity = unisList.find((u: any) =>
              data.universityId ? u.id === data.universityId : u.name === data.universityName
            )
            const matchedDepartment = deptsList.find((d: any) =>
              data.departmentId ? d.id === data.departmentId : d.name === data.departmentName
            )
            const matchedCity = citiesList.find((c: any) =>
              data.cityId ? c.id === data.cityId : c.name === data.cityName
            )

            setFormData(prev => ({
              ...prev,
              companyName: data.companyName || '',
              university: matchedUniversity?.id || '',
              universityId: matchedUniversity?.id || '',
              department: matchedDepartment?.id || '',
              departmentId: matchedDepartment?.id || '',
              city: matchedCity?.name || '',
              cityId: matchedCity?.id || '',
              internshipType: data.term === 'ShortTerm' ? 'kisa' : data.term === 'LongTerm' ? 'uzun' : prev.internshipType,
              grade: data.companyDepartment || prev.grade,
              startDate: data.startDate ? data.startDate.split('T')[0] : prev.startDate,
              endDate: data.endDate ? data.endDate.split('T')[0] : prev.endDate,
              learningScore: data.scores?.learningScore?.toString() || prev.learningScore,
              mentorScore: data.scores?.mentoringScore?.toString() || prev.mentorScore,
              techScore: data.scores?.techInfraScore?.toString() || prev.techScore,
              environmentScore: data.scores?.workEnvironmentScore?.toString() || prev.environmentScore,
              compScore: data.scores?.salaryScore?.toString() || prev.compScore,
              recommendDetail: data.scores?.wouldRecommend ? 'yes' : 'no',
              suggestions: storedNotes.suggestions || prev.suggestions,
              appliedVia: data.interview?.applicationMethod || data.interviewProcess?.applicationMethod || prev.appliedVia,
              interviewProcess: data.interview?.description || data.interviewProcess?.description || prev.interviewProcess,
              returnOfferReceived: data.returnOfferReceived ? 'yes' : 'no',
              isAnonymous: data.isAnonymous || false,
              experiences: storedNotes.experiences || data.description || data.additionalNotes || prev.experiences,
            }))
          }
        }
      } catch (err) {
        console.warn('Backend veri çekme hatası:', err)
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true)
    try {
      const payload = {
        companyName: formData.companyName,
        cityId: formData.cityId || formData.city,
        universityId: formData.universityId || formData.university,
        departmentId: formData.departmentId || formData.department,
        companyDepartment: formData.grade,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isAnonymous: formData.isAnonymous,
        term: formData.internshipType === 'uzun' ? 'LongTerm' : 'ShortTerm',
        stipendMin: 0,
        stipendMax: 0,
        currency: 'TRY',
        returnOfferReceived: formData.returnOfferReceived === 'yes',
        scores: {
          learningScore: parseInt(formData.learningScore),
          mentoringScore: parseInt(formData.mentorScore),
          techInfraScore: parseInt(formData.techScore),
          workEnvironmentScore: parseInt(formData.environmentScore),
          salaryScore: parseInt(formData.compScore),
          wouldRecommend: formData.recommendDetail === 'yes',
          additionalTips: [
            formData.experiences ? `Deneyim:\n${formData.experiences}` : '',
            formData.suggestions ? `Ek öneri:\n${formData.suggestions}` : '',
          ].filter(Boolean).join('\n\n'),
        },
        interview: {
          applicationMethod: formData.appliedVia,
          stageCount: 0,
          description: formData.interviewProcess,
        },
      }
      console.log('Payload:', JSON.stringify(payload, null, 2))
      let response
      if (isEditing && internshipId) {
        response = await internshipService.update(internshipId, payload)
        console.log('Staj başarıyla güncellendi:', response.data)
      } else {
        response = await internshipService.create(payload)
        console.log('Staj başarıyla eklendi:', response.data)
      }
      window.location.href = '/profile'
    } catch (err: any) {
      console.error('Staj ekleme hatası:', err)
      console.error('Error response:', JSON.stringify(err.response?.data, null, 2))
      console.error('Error status:', err.response?.status)
      navigate('/profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#171b26] py-12 px-4 flex justify-center text-[#333] font-['Newsreader']">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-8 md:p-12">
        {/* Staj Değerlendirme Başlığı */}
        <section className="border-b border-dashed border-gray-300 pb-8 mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-wider mb-2 uppercase font-sans">
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              STAJ DEĞERLENDİRME FORMU
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{formData.companyName || (isEditing ? 'Staj Değerlendirmesini Düzenle' : 'Yeni Staj Değerlendirmesi')}</h1>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-8 font-sans text-sm">
          {/* Temel Bilgiler */}
          <section className="border-b border-dashed border-gray-300 pb-8">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-wider mb-6 uppercase">
              <span className="material-symbols-outlined text-[18px]">info</span>
              TEMEL BİLGİLER
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-gray-700 font-medium mb-1.5">Şirket</label>
                <input
                  type="text"
                  required
                  placeholder="Şirket adını yazınız"
                  value={formData.companyName}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData({ ...formData, companyName: value })
                    setCompanyInputValue(value)

                    if (value.length >= 2) {
                      const filtered = companies.filter((c: any) =>
                        c.name.toLowerCase().includes(value.toLowerCase())
                      ).slice(0, 5)
                      setFilteredCompanies(filtered)
                      setShowCompanyDropdown(filtered.length > 0)
                    } else {
                      setShowCompanyDropdown(false)
                    }
                  }}
                  onFocus={() => {
                    if (formData.companyName.length >= 2 && filteredCompanies.length > 0) {
                      setShowCompanyDropdown(true)
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-indigo-500"
                />
                {showCompanyDropdown && filteredCompanies.length > 0 && (
                  <div className="absolute top-full left-0 right-0 border border-gray-300 border-t-0 bg-white rounded-b shadow-lg z-10">
                    {filteredCompanies.map((company: any) => (
                      <div
                        key={company.id}
                        onClick={() => {
                          setFormData({ ...formData, companyName: company.name })
                          setShowCompanyDropdown(false)
                        }}
                        className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-b-0"
                      >
                        {company.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">Üniversite</label>
                <select
                  required
                  value={formData.universityId || formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value, universityId: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-indigo-500"
                >
                  <option value="">Üniversite Seç...</option>
                  {universities.map((uni: any) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">Bölüm</label>
                <select
                  required
                  value={formData.departmentId || formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value, departmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-indigo-500"
                >
                  <option value="">Bölüm Seç...</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">Şehir</label>
                <select
                  required
                  value={formData.cityId || formData.city}
                  onChange={(e) => {
                    const selectedCity = cities.find((c: any) => c.id === e.target.value)
                    setFormData({ ...formData, city: selectedCity?.name || '', cityId: e.target.value })
                  }}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-indigo-500"
                >
                  <option value="">Şehir Seç...</option>
                  {cities.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">Staj Başlangıç Tarihi</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">Staj Bitiş Tarihi</label>
                <input
                  type="date"
                  required
                  min={formData.startDate}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">Staj Tipi</label>
                <div className="flex gap-2">
                  {['uzun', 'kisa'].map((t) => (
                    <label key={t} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="staj_tipi"
                        value={t}
                        checked={formData.internshipType === t}
                        onChange={(e) => setFormData({ ...formData, internshipType: e.target.value })}
                        className="hidden"
                      />
                      <span className={`block text-center py-2 px-3 border rounded text-xs transition ${formData.internshipType === t ? 'bg-gray-100 border-gray-500 font-bold text-gray-800' : 'border-gray-300 text-gray-500'}`}>
                        {t === 'uzun' ? 'Uzun Dönem' : 'Kısa Dönem'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">Sınıf</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full border-gray-300 rounded p-2 text-sm"
                >
                  <option>1. Sınıf</option>
                  <option>2. Sınıf</option>
                  <option>3. Sınıf</option>
                  <option>4. Sınıf</option>
                  <option>Mezun</option>
                </select>
              </div>
            </div>
          </section>

          {/* Kriter Değerlendirmeleri (1-5 Puanlar) */}
          <section className="border-b border-dashed border-gray-300 pb-8">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-wider mb-6 uppercase">
              <span className="material-symbols-outlined text-[18px]">checklist</span>
              KRİTERLER
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Öğrenme Fırsatı', key: 'learningScore' },
                { label: 'Mentorluk Kalitesi', key: 'mentorScore' },
                { label: 'Teknik Altyapı', key: 'techScore' },
                { label: 'Çalışma Ortamı', key: 'environmentScore' },
                { label: 'Ücret / Yol Yardımı', key: 'compScore' },
              ].map((crit) => (
                <div key={crit.key}>
                  <label className="block text-gray-700 font-medium mb-2">{crit.label}</label>
                  <div className="flex gap-1.5">
                    {['1', '2', '3', '4', '5'].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFormData({ ...formData, [crit.key]: num })}
                        className={`w-9 h-9 border rounded flex items-center justify-center text-xs font-semibold transition ${
                          (formData as any)[crit.key] === num ? 'bg-gray-200 border-gray-600 text-gray-900 font-bold' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Deneyimler Metin Alanı */}
          <section className="border-b border-dashed border-gray-300 pb-8">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-wider mb-4 uppercase">
              <span className="material-symbols-outlined text-[18px]">description</span>
              DENEYİMLERİN
            </div>
            <textarea
              required
              rows={5}
              value={formData.experiences}
              onChange={(e) => setFormData({ ...formData, experiences: e.target.value })}
              placeholder="Bu staj sürecinde edindiğin tecrübeleri, artı ve eksi yönleriyle detaylandır..."
              className="w-full border-gray-300 rounded p-3 text-sm focus:border-indigo-500"
            />
          </section>

          {/* Ek Öneri / Tavsiye */}
          <section className="border-b border-dashed border-gray-300 pb-8">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-wider mb-4 uppercase">
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              EK ÖNERİ / TAVSİYE
            </div>
            <p className="text-xs text-gray-600 mb-3">Gelecek stajyerler için eklemek istediğin serbest notlar.</p>
            <textarea
              rows={4}
              value={formData.suggestions}
              onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
              placeholder="Önerilerinizi buraya yazabilirsiniz..."
              className="w-full border-gray-300 rounded p-3 text-sm focus:border-indigo-500"
            />
          </section>

          {/* Mülakat Süreci */}
          <section className="border-b border-dashed border-gray-300 pb-8">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-wider mb-4 uppercase">
              <span className="material-symbols-outlined text-[18px]">description</span>
              MÜLAKAT SÜRECİ
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1.5">Nasıl Başvurdun?</label>
              <select
                value={formData.appliedVia}
                onChange={(e) => setFormData({ ...formData, appliedVia: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:border-indigo-500"
              >
                <option value="">Başvuru Yöntemi Seç...</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="CareerSite">Kariyer Sayfası</option>
                <option value="Reference">Referans</option>
                <option value="InternshipFair">Staj Fuarı</option>
                <option value="Other">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1.5">Süreç Nasıl Geçti?</label>
              <textarea
                rows={4}
                value={formData.interviewProcess}
                onChange={(e) => setFormData({ ...formData, interviewProcess: e.target.value })}
                  placeholder="Mülakat sürecinin nasıl geçtiğini ve sorulan soruları detaylandırın..."
                className="w-full border-gray-300 rounded p-3 text-sm focus:border-indigo-500"
              />
            </div>

            <div className="mt-6">
              <label className="block text-gray-700 font-medium mb-2">İşveren Taklifi Aldın mı?</label>
              <div className="flex gap-4">
                {['yes', 'no'].map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="returnOffer"
                      value={val}
                      checked={formData.returnOfferReceived === val}
                      onChange={(e) => setFormData({ ...formData, returnOfferReceived: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">{val === 'yes' ? 'Evet' : 'Hayır'}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Anonimlik Seçeneği */}
          <section className="border-b border-dashed border-gray-300 pb-8">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-wider mb-4 uppercase">
              <span className="material-symbols-outlined text-[18px]">privacy_tip</span>
              GIZLILIK
            </div>
            <div className="flex items-start gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <span className="block text-gray-700 font-medium">Değerlendirmemi Anonim Olarak Paylaş</span>
                  <span className="text-xs text-gray-600">Adınız gözükmez, sadece admin tarafından görünür</span>
                </div>
              </label>
            </div>
          </section>

          {/* SGK Doğrulama */}
          <section className="bg-teal-50/60 border border-teal-100 rounded-lg p-6">
            <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold tracking-wider uppercase mb-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              SGK DOĞRULAMA (OPSİYONEL)
            </div>
            <p className="text-xs text-gray-600 mb-4">"SGK Doğrulanmış" rozeti almak için e-Devlet kodunuzu veya barkodunuzu girebilirsiniz.</p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e-Devlet Doğrulama Kodu"
                value={formData.sgkCode}
                onChange={(e) => setFormData({ ...formData, sgkCode: e.target.value })}
                className="flex-grow border-gray-300 rounded p-2 text-xs"
              />
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-5 rounded text-xs shadow-sm transition"
              >
                Belge Yükle
              </button>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#101415] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-semibold tracking-wide transition shadow-lg"
            >
              {loading ? 'Gönderiliyor...' : 'Değerlendirmeyi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}