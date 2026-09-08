using InternScope.Entities;

namespace InternScope.Data;

public static class DbInitializer
{
    public static void SeedUniversities(AppDbContext context)
    {
        if (context.Universities.Any()) return; // zaten doluysa hiçbir şey yapma

        var names = new[]
        {
            "Boğaziçi Üniversitesi", "Orta Doğu Teknik Üniversitesi", "İstanbul Teknik Üniversitesi",
            "Sakarya Üniversitesi", "Sakarya Uygulamalı Bilimler Üniversitesi",
            "Yıldız Teknik Üniversitesi", "Hacettepe Üniversitesi", "Ankara Üniversitesi",
            "İstanbul Üniversitesi", "İstanbul Üniversitesi-Cerrahpaşa", "Gazi Üniversitesi",
            "Ege Üniversitesi", "Dokuz Eylül Üniversitesi", "Marmara Üniversitesi",
            "Koç Üniversitesi", "Sabancı Üniversitesi", "Bilkent Üniversitesi",
            "Gebze Teknik Üniversitesi", "Kocaeli Üniversitesi", "Bursa Uludağ Üniversitesi",
            "Bursa Teknik Üniversitesi", "Anadolu Üniversitesi", "Eskişehir Osmangazi Üniversitesi",
            "Eskişehir Teknik Üniversitesi", "Selçuk Üniversitesi", "Konya Teknik Üniversitesi",
            "Erciyes Üniversitesi", "Çukurova Üniversitesi", "Akdeniz Üniversitesi",
            "Karadeniz Teknik Üniversitesi", "Atatürk Üniversitesi", "Fırat Üniversitesi",
            "İnönü Üniversitesi", "Süleyman Demirel Üniversitesi", "Pamukkale Üniversitesi",
            "Trakya Üniversitesi", "Namık Kemal Üniversitesi", "Tekirdağ Namık Kemal Üniversitesi",
            "Balıkesir Üniversitesi", "Manisa Celal Bayar Üniversitesi", "Muğla Sıtkı Koçman Üniversitesi",
            "Aydın Adnan Menderes Üniversitesi", "Kütahya Dumlupınar Üniversitesi",
            "Afyon Kocatepe Üniversitesi", "Kırıkkale Üniversitesi", "Karabük Üniversitesi",
            "Düzce Üniversitesi", "Bolu Abant İzzet Baysal Üniversitesi", "Zonguldak Bülent Ecevit Üniversitesi",
            "Ondokuz Mayıs Üniversitesi", "Samsun Üniversitesi", "Ordu Üniversitesi",
            "Giresun Üniversitesi", "Recep Tayyip Erdoğan Üniversitesi", "Kastamonu Üniversitesi",
            "Çanakkale Onsekiz Mart Üniversitesi", "Uşak Üniversitesi", "Bilecik Şeyh Edebali Üniversitesi",
            "Yalova Üniversitesi", "Kırklareli Üniversitesi", "Aksaray Üniversitesi",
            "Niğde Ömer Halisdemir Üniversitesi", "Nevşehir Hacı Bektaş Veli Üniversitesi",
            "Kırşehir Ahi Evran Üniversitesi", "Yozgat Bozok Üniversitesi", "Sivas Cumhuriyet Üniversitesi",
            "Tokat Gaziosmanpaşa Üniversitesi", "Amasya Üniversitesi", "Çorum Hitit Üniversitesi",
            "Kahramanmaraş Sütçü İmam Üniversitesi", "Gaziantep Üniversitesi", "Hasan Kalyoncu Üniversitesi",
            "Mersin Üniversitesi", "Hatay Mustafa Kemal Üniversitesi", "Osmaniye Korkut Ata Üniversitesi",
            "Adıyaman Üniversitesi", "Harran Üniversitesi", "Dicle Üniversitesi",
            "Munzur Üniversitesi", "Bingöl Üniversitesi", "Muş Alparslan Üniversitesi",
            "Bitlis Eren Üniversitesi", "Van Yüzüncü Yıl Üniversitesi", "Iğdır Üniversitesi",
            "Kafkas Üniversitesi", "Ardahan Üniversitesi", "Bayburt Üniversitesi",
            "Gümüşhane Üniversitesi", "Artvin Çoruh Üniversitesi", "Erzincan Binali Yıldırım Üniversitesi",
            "Erzurum Teknik Üniversitesi", "Ağrı İbrahim Çeçen Üniversitesi", "Siirt Üniversitesi",
            "Şırnak Üniversitesi", "Mardin Artuklu Üniversitesi", "Batman Üniversitesi",
            "İstanbul Medipol Üniversitesi", "Bahçeşehir Üniversitesi", "Yeditepe Üniversitesi",
            "Özyeğin Üniversitesi", "İstanbul Bilgi Üniversitesi", "Kadir Has Üniversitesi",
            "Işık Üniversitesi", "Maltepe Üniversitesi", "İstanbul Aydın Üniversitesi",
            "İstanbul Kültür Üniversitesi", "Doğuş Üniversitesi", "Beykent Üniversitesi",
            "TOBB Ekonomi ve Teknoloji Üniversitesi", "Atılım Üniversitesi", "Çankaya Üniversitesi",
            "Başkent Üniversitesi", "Ufuk Üniversitesi", "TED Üniversitesi",
            "Ankara Yıldırım Beyazıt Üniversitesi", "Ankara Hacı Bayram Veli Üniversitesi",
            "İzmir Yüksek Teknoloji Enstitüsü", "İzmir Ekonomi Üniversitesi", "Yaşar Üniversitesi",
            "İzmir Kâtip Çelebi Üniversitesi", "İzmir Bakırçay Üniversitesi", "İzmir Demokrasi Üniversitesi"
        };

        var universities = names.Select(n => new University
        {
            Id = Guid.NewGuid(),
            Name = n,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        context.Universities.AddRange(universities);
        context.SaveChanges();
    }







    public static void SeedCities(AppDbContext context)
    {
        if (context.Cities.Any()) return; // zaten doluysa çık

        var names = new[]
        {
        "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya",
        "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
        "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne",
        "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane",
        "Hakkâri", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu",
        "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya",
        "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu",
        "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
        "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray",
        "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan",
        "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
    };

        var cities = names.Select(n => new City
        {
            Id = Guid.NewGuid(),
            Name = n,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        context.Cities.AddRange(cities);
        context.SaveChanges();
    }



    public static void SeedDepartments(AppDbContext context)
    {
        if (context.Departments.Any()) return;

        var names = new[]
            
           
{
    // ---- BİLGİSAYAR / YAZILIM / BİLİŞİM ----
    "Bilgisayar Mühendisliği", "Yazılım Mühendisliği", "Bilişim Sistemleri Mühendisliği",
    "Yapay Zeka Mühendisliği", "Yapay Zeka ve Veri Mühendisliği", "Veri Bilimi",
    "Bilgisayar Bilimleri", "Yönetim Bilişim Sistemleri", "Bilgi Sistemleri ve Teknolojileri",

    // ---- ELEKTRİK / ELEKTRONİK ----
    "Elektrik Mühendisliği", "Elektronik Mühendisliği", "Elektrik-Elektronik Mühendisliği",
    "Elektronik ve Haberleşme Mühendisliği", "Kontrol ve Otomasyon Mühendisliği",
    "Biyomedikal Mühendisliği",

    // ---- MAKİNE / MEKATRONİK / İMALAT ----
    "Makine Mühendisliği", "Makine ve İmalat Mühendisliği", "Mekatronik Mühendisliği",
    "İmalat Mühendisliği", "Otomotiv Mühendisliği", "Enerji Sistemleri Mühendisliği",
    "Nükleer Enerji Mühendisliği",

    // ---- ENDÜSTRİ / İŞLETME MÜH. ----
    "Endüstri Mühendisliği", "Endüstri Sistemleri Mühendisliği", "İşletme Mühendisliği",

    // ---- İNŞAAT / ÇEVRE / HARİTA / JEO ----
    "İnşaat Mühendisliği", "Çevre Mühendisliği", "Harita Mühendisliği",
    "Geomatik Mühendisliği", "Jeoloji Mühendisliği", "Jeofizik Mühendisliği",
    "Maden Mühendisliği", "Petrol ve Doğalgaz Mühendisliği", "Cevher Hazırlama Mühendisliği",

    // ---- KİMYA / MALZEME / GIDA ----
    "Kimya Mühendisliği", "Gıda Mühendisliği", "Biyomühendislik",
    "Genetik ve Biyomühendislik", "Malzeme Bilimi ve Mühendisliği",
    "Metalurji ve Malzeme Mühendisliği", "Polimer Mühendisliği", "Tekstil Mühendisliği",

    // ---- HAVACILIK / UZAY / DENİZ ----
    "Uçak Mühendisliği", "Havacılık ve Uzay Mühendisliği", "Uzay Mühendisliği",
    "Uçak ve Uzay Mühendisliği", "Gemi İnşaatı ve Gemi Makineleri Mühendisliği",
    "Gemi Makineleri İşletme Mühendisliği", "Deniz Ulaştırma İşletme Mühendisliği",

    // ---- TARIM / ORMAN / SU ----
    "Ziraat Mühendisliği", "Tarım Makineleri ve Teknolojileri Mühendisliği",
    "Su Ürünleri Mühendisliği", "Orman Mühendisliği", "Orman Endüstri Mühendisliği",

    // ---- MİMARLIK / TASARIM / PLANLAMA ----
    "Mimarlık", "İç Mimarlık", "İç Mimarlık ve Çevre Tasarımı", "Şehir ve Bölge Planlama",
    "Peyzaj Mimarlığı", "Endüstriyel Tasarım", "Endüstri Ürünleri Tasarımı",

    // ---- İŞLETME / EKONOMİ / FİNANS ----
    "İşletme", "İktisat", "Ekonomi", "Ekonometri", "Maliye",
    "Muhasebe ve Finans Yönetimi", "Bankacılık ve Finans", "Sigortacılık",
    "Uluslararası Ticaret ve Lojistik", "Lojistik Yönetimi", "Uluslararası İşletme Yönetimi",
    "İnsan Kaynakları Yönetimi", "Sağlık Yönetimi", "Havacılık Yönetimi",

    // ---- SİYASET / KAMU / ULUSLARARASI ----
    "Uluslararası İlişkiler", "Siyaset Bilimi ve Kamu Yönetimi",
    "Siyaset Bilimi ve Uluslararası İlişkiler", "Kamu Yönetimi",

    // ---- İLETİŞİM ----
    "Halkla İlişkiler ve Tanıtım", "Reklamcılık", "Gazetecilik",
    "Yeni Medya ve İletişim", "Radyo Televizyon ve Sinema", "İletişim ve Tasarım",
    "Görsel İletişim Tasarımı",

    // ---- HUKUK ----
    "Hukuk",

    // ---- SOSYAL / BEŞERİ ----
    "Psikoloji", "Sosyoloji", "Felsefe", "Tarih", "Coğrafya", "Antropoloji",
    "Arkeoloji", "Sanat Tarihi", "Türk Dili ve Edebiyatı", "İngiliz Dili ve Edebiyatı",
    "Amerikan Kültürü ve Edebiyatı", "Alman Dili ve Edebiyatı", "Fransız Dili ve Edebiyatı",
    "Mütercim ve Tercümanlık", "Çeviribilim", "Dilbilim",

    // ---- EĞİTİM / ÖĞRETMENLİK ----
    "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Okul Öncesi Öğretmenliği",
    "İlköğretim Matematik Öğretmenliği", "Fen Bilgisi Öğretmenliği",
    "Bilgisayar ve Öğretim Teknolojileri Öğretmenliği", "İngilizce Öğretmenliği",
    "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Özel Eğitim Öğretmenliği",
    "Beden Eğitimi ve Spor Öğretmenliği",

    // ---- FEN BİLİMLERİ ----
    "Matematik", "Matematik Mühendisliği", "Fizik", "Fizik Mühendisliği", "Kimya",
    "Biyoloji", "İstatistik", "Moleküler Biyoloji ve Genetik",
    "Astronomi ve Uzay Bilimleri", "Aktüerya Bilimleri",

    // ---- SAĞLIK ----
    "Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Ebelik",
    "Fizyoterapi ve Rehabilitasyon", "Beslenme ve Diyetetik", "Odyoloji",
    "Dil ve Konuşma Terapisi", "Ergoterapi", "Sağlık Yönetimi",
    "Tıbbi Laboratuvar Teknikleri", "Veteriner Fakültesi",

    // ---- TURİZM / SPOR / SANAT ----
    "Turizm İşletmeciliği", "Turizm Rehberliği", "Gastronomi ve Mutfak Sanatları",
    "Spor Bilimleri", "Antrenörlük Eğitimi", "Rekreasyon", "Güzel Sanatlar",
    "Müzik", "Resim", "Heykel", "Grafik Tasarım", "Fotoğraf",
    "Sahne Sanatları", "Moda ve Tekstil Tasarımı",

    // ---- DİĞER ----
    "Diğer"
};


        var departments = names.Distinct().Select(n => new Department
        {
            Id = Guid.NewGuid(),
            Name = n,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        context.Departments.AddRange(departments);
        context.SaveChanges();
    }















}