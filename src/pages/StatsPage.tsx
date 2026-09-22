import { useState, useEffect } from 'react'
import { statsService } from '../services/statsService'
import { internshipService } from '../services/internshipService'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsivePie } from '@nivo/pie'

interface UniversityStats {
  universityName: string
  internshipCount: number
  averageScore?: number
}

interface DepartmentStats {
  departmentName: string
  averageScore: number
  internshipCount?: number
}

interface OverallStats {
  totalInternships: number
  totalCompanies: number
  totalUniversities: number
  averageScore: number
}

interface FilterOption {
  id: string
  name: string
}

export default function StatsPage() {
  const [universityStats, setUniversityStats] = useState<UniversityStats[]>([])
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [universities, setUniversities] = useState<FilterOption[]>([])
  const [departments, setDepartments] = useState<FilterOption[]>([])
  const [companies, setCompanies] = useState<FilterOption[]>([])

  const [selectedUniversity, setSelectedUniversity] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [allInternships, setAllInternships] = useState<any[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const [uniRes, deptRes, overallRes, internshipRes] = await Promise.all([
          statsService.getUniversity(),
          statsService.getDepartment(),
          statsService.getOverall(),
          internshipService.getAll({ limit: 10000 }),
        ])

        setUniversityStats(uniRes.data || [])
        setDepartmentStats(deptRes.data || [])
        setOverallStats(overallRes.data || null)

        const internships = Array.isArray(internshipRes.data)
          ? internshipRes.data
          : internshipRes.data?.items || []
        setAllInternships(internships)

        const universities = (uniRes.data || []).map((u: any) => ({
          id: u.id || u.universityName,
          name: u.universityName,
        }))
        const departments = (deptRes.data || []).map((d: any) => ({
          id: d.id || d.departmentName,
          name: d.departmentName,
        }))
        const companies: FilterOption[] = Array.from(
          new Set((internships || []).map((i: any) => i.companyName).filter(Boolean))
        ).map((c) => ({
          id: c as string,
          name: c as string,
        }))

        setUniversities(universities)
        setDepartments(departments)
        setCompanies(companies)
      } catch (err) {
        console.warn('İstatistikleri yüklerken hata:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    if (allInternships.length === 0) return

    let filtered = allInternships

    if (selectedUniversity) {
      filtered = filtered.filter((i) => i.universityName === selectedUniversity)
    }
    if (selectedDepartment) {
      filtered = filtered.filter((i) => i.departmentName === selectedDepartment)
    }
    if (selectedCompany) {
      filtered = filtered.filter((i) => i.companyName === selectedCompany)
    }

    const uniMap = new Map<string, { count: number; scores: number[] }>()
    const deptMap = new Map<string, { count: number; scores: number[] }>()

    filtered.forEach((i: any) => {
      const uniName = i.universityName || 'Bilinmiyor'
      if (!uniMap.has(uniName)) uniMap.set(uniName, { count: 0, scores: [] })
      const uniData = uniMap.get(uniName)!
      uniData.count++
      if (i.scores) {
        const avg =
          (i.scores.learningScore +
            i.scores.mentoringScore +
            i.scores.techInfraScore +
            i.scores.workEnvironmentScore +
            i.scores.salaryScore) /
          5
        uniData.scores.push(avg)
      }

      const deptName = i.departmentName || 'Bilinmiyor'
      if (!deptMap.has(deptName)) deptMap.set(deptName, { count: 0, scores: [] })
      const deptData = deptMap.get(deptName)!
      deptData.count++
      if (i.scores) {
        const avg =
          (i.scores.learningScore +
            i.scores.mentoringScore +
            i.scores.techInfraScore +
            i.scores.workEnvironmentScore +
            i.scores.salaryScore) /
          5
        deptData.scores.push(avg)
      }
    })

    const uniStats: UniversityStats[] = Array.from(uniMap).map(([name, data]) => ({
      universityName: name,
      internshipCount: data.count,
      averageScore:
        data.scores.length > 0 ? data.scores.reduce((a, b) => a + b) / data.scores.length : 0,
    }))

    const deptStats: DepartmentStats[] = Array.from(deptMap).map(([name, data]) => ({
      departmentName: name,
      internshipCount: data.count,
      averageScore:
        data.scores.length > 0 ? data.scores.reduce((a, b) => a + b) / data.scores.length : 0,
    }))

    const allScores: number[] = []
    filtered.forEach((i: any) => {
      if (i.scores) {
        const avg =
          (i.scores.learningScore || 0) +
          (i.scores.mentoringScore || 0) +
          (i.scores.techInfraScore || 0) +
          (i.scores.workEnvironmentScore || 0) +
          (i.scores.salaryScore || 0)
        allScores.push(avg / 5)
      }
    })

    const uniqueCompanies = new Set(filtered.map((i: any) => i.companyName).filter(Boolean))
    const uniqueUniversities = new Set(filtered.map((i: any) => i.universityName).filter(Boolean))

    const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0

    const calculatedOverallStats: OverallStats = {
      totalInternships: filtered.length,
      totalCompanies: uniqueCompanies.size,
      totalUniversities: uniqueUniversities.size,
      averageScore: avgScore,
    }

    setUniversityStats(uniStats)
    setDepartmentStats(deptStats)
    setOverallStats(calculatedOverallStats)
  }, [allInternships, selectedUniversity, selectedDepartment, selectedCompany])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#101415] text-[#e0e3e5] py-16 px-4">
        <div className="text-center">
          <p className="text-lg">İstatistikler yükleniyor...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#101415] text-[#e0e3e5] py-16 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-12">
          <h1 className="font-['Newsreader'] text-4xl font-bold text-[#e0e3e5] mb-2">
            Platform İstatistikleri
          </h1>
          <p className="font-['IBM_Plex_Mono'] text-xs text-[#45464c] uppercase tracking-widest">
            Üniversite, Bölüm ve Firma Analizi
          </p>
        </div>

        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <select
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
            className="bg-[#1d2022] border border-[#252c38] rounded-lg px-4 py-3 text-[#e0e3e5] focus:outline-none focus:ring-2 focus:ring-[#700080]"
          >
            <option value="">Tüm Üniversiteler</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-[#1d2022] border border-[#252c38] rounded-lg px-4 py-3 text-[#e0e3e5] focus:outline-none focus:ring-2 focus:ring-[#700080]"
          >
            <option value="">Tüm Bölümler</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="bg-[#1d2022] border border-[#252c38] rounded-lg px-4 py-3 text-[#e0e3e5] focus:outline-none focus:ring-2 focus:ring-[#700080]"
          >
            <option value="">Tüm Firmalar</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-gradient-to-br from-[#700080] to-[#1d2022] border border-[#700080]/30 rounded-xl p-6 shadow-lg">
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#F59E0B] uppercase tracking-wider mb-2">
                Toplam Staj
              </p>
              <p className="font-['Newsreader'] text-3xl font-bold text-[#e0e3e5]">
                {overallStats.totalInternships}
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#456552] to-[#1d2022] border border-[#456552]/30 rounded-xl p-6 shadow-lg">
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#F59E0B] uppercase tracking-wider mb-2">
                Firmalar
              </p>
              <p className="font-['Newsreader'] text-3xl font-bold text-[#e0e3e5]">
                {overallStats.totalCompanies}
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#F59E0B] to-[#1d2022] border border-[#F59E0B]/30 rounded-xl p-6 shadow-lg">
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#700080] uppercase tracking-wider mb-2">
                Üniversiteler
              </p>
              <p className="font-['Newsreader'] text-3xl font-bold text-[#e0e3e5]">
                {overallStats.totalUniversities}
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#1E293B] to-[#050B1A] border border-[#700080]/30 rounded-xl p-6 shadow-lg">
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#F59E0B] uppercase tracking-wider mb-2">
                Ort. Puan
              </p>
              <p className="font-['Newsreader'] text-3xl font-bold text-[#F59E0B]">
                {(overallStats.averageScore ?? 0).toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        {universityStats.length > 0 && (
          <div className="bg-[#1d2022] border border-[#252c38] rounded-xl p-8 mb-12 shadow-xl">
            <h2 className="font-['Newsreader'] text-2xl font-bold text-[#e0e3e5] mb-6">
              Üniversite Bazlı Staj Dağılımı
            </h2>
            <div style={{ height: '400px' }}>
              <ResponsiveBar
                data={universityStats as any}
                keys={['internshipCount']}
                indexBy="universityName"
                margin={{ top: 20, right: 30, bottom: 100, left: 60 }}
                padding={0.3}
                colors={['#700080']}
                animate={true}
                motionConfig="molasses"
                theme={{
                  axis: {
                    ticks: { line: { stroke: '#252c38' }, text: { fill: '#e0e3e5', fontSize: 12 } },
                    legend: { text: { fill: '#e0e3e5', fontSize: 14 } },
                  },
                  grid: { line: { stroke: '#252c38' } },
                  labels: { text: { fill: '#e0e3e5' } },
                }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {departmentStats.length > 0 && (
            <div className="bg-[#1d2022] border border-[#252c38] rounded-xl p-8 shadow-xl">
              <h2 className="font-['Newsreader'] text-2xl font-bold text-[#e0e3e5] mb-6">
                Bölüm Bazlı Ortalama Puan
              </h2>
              <div style={{ height: '350px' }}>
                <ResponsiveBar
                  data={departmentStats as any}
                  keys={['averageScore']}
                  indexBy="departmentName"
                  margin={{ top: 20, right: 30, bottom: 100, left: 60 }}
                  padding={0.3}
                  colors={['#456552']}
                  animate={true}
                  motionConfig="molasses"
                  theme={{
                    axis: {
                      ticks: { line: { stroke: '#252c38' }, text: { fill: '#e0e3e5', fontSize: 12 } },
                      legend: { text: { fill: '#e0e3e5', fontSize: 14 } },
                    },
                    grid: { line: { stroke: '#252c38' } },
                    labels: { text: { fill: '#e0e3e5' } },
                  }}
                />
              </div>
            </div>
          )}

          {departmentStats.length > 0 && departmentStats.some((d) => d.internshipCount) && (
            <div className="bg-[#1d2022] border border-[#252c38] rounded-xl p-8 shadow-xl">
              <h2 className="font-['Newsreader'] text-2xl font-bold text-[#e0e3e5] mb-6">
                Bölüm Dağılımı
              </h2>
              <div style={{ height: '350px' }}>
                <ResponsivePie
                  data={departmentStats.filter((d) => d.internshipCount).map((d) => ({
                    id: d.departmentName,
                    label: d.departmentName,
                    value: d.internshipCount || 0,
                  }))}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  colors={['#700080', '#F59E0B', '#456552', '#1E293B', '#050B1A']}
                  arcLabel={(d) => `${d.label} (${d.value})`}
                  animate={true}
                  motionConfig="molasses"
                  theme={{
                    labels: { text: { fill: '#e0e3e5' } },
                    legends: { text: { fill: '#909097' } },
                  }}
                  legends={[
                    {
                      anchor: 'bottom',
                      direction: 'row',
                      justify: false,
                      translateX: 0,
                      translateY: 56,
                      itemsSpacing: 10,
                      itemWidth: 100,
                      itemHeight: 18,
                      itemTextColor: '#909097',
                      symbolSize: 18,
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
