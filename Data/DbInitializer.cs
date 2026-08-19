using InternScope.Entities;

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
}