"""
Large Indonesian name bank for persona generation.

The lists below are manually curated common Indonesian name components across
regional, religious, and modern naming styles. They intentionally avoid scraping
private/person-specific datasets.
"""

import random
from collections.abc import Iterable


def _dedupe(items: Iterable[str]) -> list[str]:
    """Return non-empty strings with duplicates removed while preserving order."""
    seen: set[str] = set()
    results: list[str] = []
    for item in items:
        clean = " ".join(item.strip().split())
        key = clean.casefold()
        if clean and key not in seen:
            seen.add(key)
            results.append(clean)
    return results


_MALE_ROOTS = [
    # Jawa / umum Indonesia
    "Budi", "Agus", "Wahyu", "Doni", "Hendra", "Bayu", "Fajar", "Rizky", "Arif", "Teguh",
    "Yudi", "Bambang", "Slamet", "Surya", "Dimas", "Galih", "Bagus", "Eko", "Joko", "Wawan",
    "Iwan", "Hadi", "Sigit", "Prasetyo", "Nugroho", "Purnomo", "Widodo", "Susilo", "Hartono",
    "Supriyanto", "Triyono", "Mulyadi", "Dwi", "Rudi", "Rizal", "Hery", "Heru", "Untung",
    "Yanto", "Jaya", "Rian", "Rio", "Ari", "Adit", "Dian", "Dito", "Tomi", "Tono",
    "Darma", "Bima", "Panji", "Gatot", "Wicak", "Wira", "Cahyo", "Catur", "Yoga", "Yudha",
    "Nanda", "Raka", "Rama", "Rangga", "Satria", "Gilang", "Bintang", "Bagas", "Ranggi",
    # Sunda / Betawi
    "Asep", "Dede", "Ujang", "Ade", "Ridwan", "Yayan", "Nana", "Dadan", "Cecep", "Dadang",
    "Nanang", "Rohman", "Encep", "Tatang", "Yusup", "Endang", "Cucu", "Usep", "Aang",
    "Dudung", "Maman", "Jajang", "Udin", "Oman", "Koswara", "Soleh", "Sobari", "Entis",
    "Sarman", "Jamal", "Mamat", "Benyamin", "Babeh", "Doel", "Mandra", "Junaedi",
    # Batak / Sumatra
    "Hotma", "Martua", "Mangatur", "Binsar", "Bonar", "Dohar", "Sahat", "Tulus", "Parulian",
    "Hasudungan", "Parlindungan", "Poltak", "Togar", "Horas", "Jogi", "Maruli", "Binsar",
    "Bona", "Rinto", "Tigor", "Maringan", "Haposan", "Jansen", "Roy", "Dame", "Daulat",
    # Melayu / Minang / Aceh
    "Zulkifli", "Harun", "Ridho", "Hafiz", "Fadhil", "Razak", "Azmi", "Amri", "Fauzi",
    "Syafrizal", "Hendri", "Rasyid", "Khairul", "Zulfadli", "Fikri", "Fauzan", "Rizqan",
    "Rafif", "Rafi", "Rafli", "Ikhsan", "Ikhwan", "Fahmi", "Fadli", "Irsyad", "Muzakki",
    "Taufik", "Tengku", "Teuku", "Iskandar", "Mansur", "Mahmud", "Zakaria", "Syahril",
    "Syukri", "Anwar", "Burhan", "Darwis", "Effendi", "Kamal", "Nasrul", "Rizwan",
    # Bugis / Makassar / Banjar / Bali / Timur
    "Andi", "Laode", "Irfan", "Arman", "Syahrul", "Basri", "Bahar", "Hamsah", "Ruslan",
    "Rahmat", "Ridwan", "Ilham", "Haikal", "Ikbal", "Baharuddin", "Sudirman", "Saiful",
    "Made", "Wayan", "Nyoman", "Ketut", "Gede", "Putu", "Komang", "Gusti", "Kadek",
    "Wira", "Dewa", "Anom", "Agung", "Yosef", "Yonas", "Markus", "Paulus", "Stefanus",
    "Moses", "Yohanis", "Frits", "Hendrik", "Yance", "Yakobus", "Oktavianus", "Kristian",
    # Muslim / Arabic Indonesian
    "Muhammad", "Ahmad", "Faisal", "Farhan", "Reza", "Daffa", "Aditya", "Andika", "Fakhri",
    "Naufal", "Raihan", "Dzikri", "Hafidz", "Rizqi", "Rizki", "Aziz", "Azzam", "Ammar",
    "Bilal", "Daniyal", "Fadhlan", "Faiz", "Faizal", "Faris", "Ghifari", "Hanif", "Hasan",
    "Husein", "Ibrahim", "Ihsan", "Imam", "Iqbal", "Izzan", "Khalid", "Lukman", "Malik",
    "Nabil", "Rafiq", "Rasyad", "Rayyan", "Salman", "Taqi", "Yasir", "Yusuf", "Zaid",
    # Modern / Chinese-Indonesian common usage
    "Kevin", "Bryan", "Steven", "Christian", "Rendy", "Randy", "Sandy", "Ferdy", "Angga",
    "Erwin", "Edwin", "Irwan", "Guntur", "Haris", "Denny", "Benny", "Jason", "Justin",
    "Jeremy", "Daniel", "David", "Michael", "Nicholas", "Jonathan", "Albert", "Alvin",
    "Felix", "Vincent", "William", "Ryan", "Brandon", "Calvin", "Edward", "Leonardo",
    "Marcell", "Ricky", "Rico", "Robby", "Tommy", "Victor", "Willy", "Yohanes",
    # Additional male names - batch 1
    "Fikri", "Akbar", "Habibi", "Syarif", "Firdaus", "Irfandi", "Syaiful", "Fadil",
    "Raffi", "Rafly", "Rafi", "Rafiq", "Rasyid", "Reza", "Ridho", "Rifqi", "Rizal",
    "Rizki", "Rizky", "Robi", "Roni", "Rudi", "Rudy", "Rusdi", "Ruslan", "Saiful",
    "Saleh", "Salim", "Samsul", "Sandi", "Sandy", "Sapto", "Satria", "Septian",
    "Setya", "Sigit", "Sofyan", "Sugiarto", "Suhardi", "Suharjo", "Sukirman",
    "Sukma", "Sulton", "Sumardi", "Sunaryo", "Sunarto", "Supardi", "Supriyadi",
    "Suroso", "Susanto", "Sutarno", "Sutejo", "Sutikno", "Sutopo", "Suyanto",
    "Syahril", "Syahroni", "Syamsul", "Taufan", "Teguh", "Tito", "Toni", "Tony",
    "Tri", "Trianto", "Umar", "Usman", "Vino", "Wahid", "Wahyono", "Wawan",
    "Wibowo", "Widya", "Willy", "Winarto", "Wisnu", "Yanto", "Yayan", "Yogi",
    "Yono", "Yudi", "Yudhi", "Yulianto", "Yusril", "Zaenal", "Zainal", "Zaki",
    "Zulfikar", "Zulham", "Aan", "Abid", "Abidin", "Achmad", "Adang", "Adhi",
    "Adin", "Adnan", "Adriansyah", "Afif", "Agung", "Agustinus", "Ahsan", "Aiman",
    "Ainun", "Ajie", "Akhmad", "Alam", "Aldy", "Alfi", "Alfian", "Ali", "Alim",
    "Amir", "Amin", "Amri", "Anas", "Andri", "Anggi", "Anggun", "Anis", "Anwar",
    "Ardianto", "Ardian", "Arfan", "Arham", "Ari", "Ariel", "Arman", "Arya",
    "Asep", "Asri", "Asyraf", "Atep", "Athallah", "Aufa", "Awal", "Azhar", "Azis",
    "Azka", "Bagas", "Bagus", "Bahri", "Bakti", "Bambang", "Bayu", "Beni", "Benny",
    "Bima", "Bintang", "Bobi", "Bobby", "Bondan", "Budhi", "Budianto", "Cahya",
    "Cahyo", "Candra", "Chandra", "Dadan", "Daffa", "Dani", "Daniyal", "Danu",
    "Darmadi", "Darwis", "Daud", "Dede", "Dedi", "Deny", "Derry", "Deva", "Dewa",
    "Dhani", "Dian", "Dicky", "Didi", "Dika", "Dimas", "Dion", "Dirgantara", "Dito",
    "Dody", "Donny", "Dwiki", "Edi", "Eddy", "Edy", "Efendi", "Eka", "Eko",
    "Elang", "Endra", "Eri", "Erik", "Erick", "Erlangga", "Erwin", "Evan", "Fadel",
    "Fadlan", "Fahmi", "Fahri", "Fahreza", "Faiz", "Faizal", "Fajri", "Fakhri",
    "Faqih", "Farhan", "Faris", "Fauzan", "Fauzi", "Faza", "Feri", "Ferry",
    "Firdaus", "Firman", "Galang", "Galih", "Gani", "Genta", "Ghani", "Ghifari",
    "Gibran", "Gilang", "Gunawan", "Guntur", "Habib", "Hadi", "Hafidz", "Hafiz",
    "Haidar", "Haikal", "Hakim", "Halim", "Hamdan", "Hamid", "Hamzah", "Hanafi",
    "Hanif", "Haris", "Hariyanto", "Hasan", "Hasbi", "Hendri", "Hendro", "Hengki",
    # Additional male names - batch 2
    "Herman", "Heru", "Hidayat", "Hilman", "Husni", "Ibnu", "Ichsan", "Ikhsan",
    "Ilyas", "Imam", "Imran", "Indra", "Iqbal", "Irfan", "Irwan", "Ismail",
    "Isnan", "Ivan", "Izzat", "Jafar", "Jamal", "Jamil", "Januar", "Jaya",
    "Jefri", "Joni", "Juanda", "Julianto", "Jumadi", "Kamal", "Kemas", "Kemal",
    "Khairul", "Khoirul", "Kurnia", "Latif", "Luthfi", "Mahdi", "Mahendra",
    "Mahmud", "Makmur", "Malik", "Mansur", "Marwan", "Maulana", "Mirza", "Misbah",
    "Muchlis", "Muhamad", "Muhaimin", "Muhsin", "Mujahid", "Mukti", "Munir",
    "Murni", "Mursid", "Muslich", "Mustafa", "Nabil", "Nanda", "Naufal", "Nazril",
    "Nizar", "Noval", "Nugraha", "Nuh", "Nurdin", "Nurman", "Pandu", "Panji",
    "Prabowo", "Prabu", "Praja", "Pramana", "Pramudya", "Pranata", "Pratama",
    "Putra", "Qodir", "Radit", "Raditya", "Raffi", "Ragil", "Rahadian", "Raharjo",
    "Rahim", "Rahman", "Raka", "Rakha", "Rama", "Ramadhan", "Ramdan", "Randi",
    "Rangga", "Rasyad", "Rayhan", "Rayyan", "Rehan", "Renaldi", "Rendra", "Reza",
    "Ridwan", "Rifai", "Rifan", "Rifki", "Riko", "Rinaldi", "Rinto", "Riski",
    "Riyan", "Rizal", "Rizki", "Robi", "Rochman", "Rofi", "Rohman", "Roni",
    "Rosyid", "Rudianto", "Rusdi", "Sabri", "Sadam", "Saddam", "Sahid", "Sahrul",
    "Sakti", "Saladin", "Saleh", "Samsul", "Sandi", "Santoso", "Saputra", "Satrio",
    "Septian", "Setiadi", "Setyo", "Shidiq", "Sidik", "Sigit", "Sofyan", "Solihin",
    "Subhan", "Suci", "Sudirman", "Sugeng", "Suharto", "Suhendar", "Sulaiman",
    "Sultan", "Sumanto", "Sumarno", "Supriyadi", "Surya", "Sutrisno", "Syafiq",
    "Syahrul", "Syaiful", "Syamsul", "Tama", "Taufiq", "Teguh", "Tito", "Toni",
    "Topan", "Tri", "Udin", "Ujang", "Umar", "Usman", "Utomo", "Vicky", "Wahyu",
    "Wawan", "Widi", "Widodo", "Wildan", "Willy", "Wisnu", "Yanto", "Yayan",
    "Yoga", "Yogi", "Yudha", "Yudi", "Yulianto", "Yusuf", "Zaenal", "Zaini",
    "Zaki", "Zidan", "Zikri", "Zulfikar", "Zulkifli",
]

_FEMALE_ROOTS = [
    # Jawa / umum Indonesia
    "Siti", "Dewi", "Sri", "Indah", "Rina", "Rini", "Wati", "Yuni", "Fitri", "Ayu",
    "Novi", "Lestari", "Wahyuni", "Sulistyowati", "Rahayu", "Purwanti", "Suprapti",
    "Mulyani", "Handayani", "Widyastuti", "Kurniawati", "Susanti", "Ratna", "Retno",
    "Endah", "Niken", "Sekar", "Kartika", "Puspita", "Melati", "Mawar", "Anggraini",
    "Pratiwi", "Utami", "Wulan", "Citra", "Diah", "Dian", "Ratri", "Tika", "Tari",
    "Rara", "Dinda", "Ajeng", "Putri", "Anindya", "Aning", "Ningrum", "Intan", "Permata",
    "Maya", "Laras", "Asti", "Aulia", "Ayu", "Dewinta", "Sekarini", "Mega", "Pertiwi",
    # Sunda / Betawi
    "Neneng", "Neng", "Teti", "Euis", "Ai", "Yani", "Santi", "Lilis", "Neni", "Yati",
    "Oom", "Ida", "Icih", "Kokom", "Eneng", "Titin", "Tuti", "Mimin", "Imas", "Iis",
    "Yuyun", "Een", "Dedeh", "Ira", "Lia", "Lina", "Nia", "Nining", "Pipih", "Ros",
    "Aminah", "Rohayati", "Saodah", "Jubaedah", "Maemunah", "Rukayah", "Mpok", "Nuraini",
    # Batak / Sumatra
    "Hotmian", "Lasma", "Rosmery", "Tiurma", "Rotua", "Naomi", "Debora", "Ruth", "Ester",
    "Meilani", "Romauli", "Rohana", "Sondang", "Marlina", "Lestina", "Herawati", "Yohana",
    "Martha", "Kristina", "Lidia", "Jelita", "Dumaris", "Friska", "Novita", "Yanti",
    # Melayu / Minang / Aceh
    "Nurhasanah", "Zulaikha", "Hafizah", "Rahmawati", "Fauziah", "Nurul", "Halimah",
    "Syafitri", "Mailinda", "Wirda", "Rahmi", "Yusra", "Rizka", "Fitria", "Mardiana",
    "Eliza", "Zahira", "Nadya", "Farah", "Humaira", "Nurlaila", "Syarifah", "Cut",
    "Mutiara", "Safira", "Zahara", "Azkia", "Nisrina", "Rania", "Nazwa", "Balqis",
    # Bugis / Makassar / Banjar / Bali / Timur
    "Nurhayati", "Jumriani", "Rosdiana", "Herlina", "Hasnawati", "Wulandari",
    "Kartini", "Sukmawati", "Aminah", "Rahma", "Winda", "Hilda", "Riska", "Sriwahyuni",
    "Ni", "Made", "Kadek", "Komang", "Putu", "Luh", "Ayu", "Desak", "Gusti", "Ketut",
    "Wayan", "Maria", "Yuliana", "Yohana", "Marlina", "Agustina", "Theresia", "Kristina",
    "Monika", "Veronika", "Anastasia", "Fransiska", "Karolina", "Lusia", "Melania",
    # Muslim / Arabic Indonesian
    "Fatimah", "Aisyah", "Khadijah", "Zahra", "Nadia", "Nabila", "Naila", "Salma", "Hana",
    "Sarah", "Amira", "Laila", "Anisa", "Salsabila", "Azizah", "Maryam", "Azzahra",
    "Alya", "Almira", "Aqeela", "Aqila", "Dania", "Fathia", "Ghaitsa", "Hafsa", "Kanza",
    "Kirana", "Latifa", "Mahira", "Marwa", "Najwa", "Naura", "Qonita", "Raissa",
    "Safiyya", "Shafira", "Syifa", "Tsabita", "Yasmin", "Zalfa", "Zaskia",
    # Modern / Chinese-Indonesian common usage
    "Jessica", "Cindy", "Melissa", "Monica", "Stephanie", "Claudia", "Della", "Bella",
    "Fella", "Tara", "Clara", "Diana", "Rani", "Nisa", "Mira", "Dira", "Lira", "Angel",
    "Angela", "Audrey", "Beatrice", "Caroline", "Catherine", "Celina", "Chelsea", "Clarissa",
    "Felicia", "Gabriella", "Grace", "Irene", "Janice", "Jennifer", "Karen", "Laura",
    "Michelle", "Natasha", "Patricia", "Regina", "Sherly", "Silvia", "Valencia", "Vanessa",
    # Additional female names - batch 1
    "Adelia", "Adinda", "Adisti", "Aghnia", "Aida", "Aina", "Aini", "Aira",
    "Aisyah", "Alya", "Amalia", "Amanda", "Amara", "Amelia", "Amina", "Amira",
    "Ananda", "Anastasya", "Andini", "Anindita", "Anisa", "Annisa", "Anjani", "Aqila",
    "Arafah", "Ardelia", "Ardina", "Ariana", "Ariani", "Arin", "Arinda", "Arini",
    "Arum", "Asha", "Asih", "Asri", "Astrid", "Aulia", "Aura", "Aurora", "Avita",
    "Ayu", "Azalia", "Azhara", "Azzahra", "Bella", "Belinda", "Bilqis", "Bunga",
    "Cahaya", "Cahyaning", "Cahyani", "Calista", "Camila", "Cantika", "Cempaka",
    "Citra", "Clara", "Dara", "Darin", "Della", "Delima", "Dewanti", "Dewi", "Diah",
    "Dian", "Dina", "Dinda", "Dini", "Dita", "Dwi", "Elina", "Elvira", "Elya",
    "Emilia", "Endah", "Eni", "Erlina", "Erna", "Ernawati", "Ester", "Eva", "Evita",
    "Fadhila", "Fadila", "Fahira", "Fajrina", "Farah", "Farida", "Fathia", "Fatimah",
    "Fauziah", "Febri", "Febriana", "Feli", "Felicia", "Fina", "Finna", "Fira", "Firda",
    "Firdaus", "Fitri", "Fitriana", "Friska", "Ghina", "Gita", "Grace", "Hafizah",
    "Hana", "Hanifah", "Hani", "Hanna", "Hapsari", "Hasna", "Hesti", "Hilda", "Humaira",
    "Husna", "Icha", "Ida", "Ika", "Ila", "Ilma", "Imelda", "Ina", "Indah", "Indira",
    "Indri", "Intan", "Ira", "Irena", "Irma", "Isna", "Isnaini", "Ita", "Ivana",
    "Jasmine", "Jelita", "Jessica", "Jihan", "Jihan", "Julia", "Juliana", "Juwita",
    "Kania", "Karina", "Kartika", "Kasih", "Kezia", "Kirana", "Kireina", "Kusuma",
    "Laila", "Laili", "Laras", "Larasati", "Laura", "Lavina", "Lestari", "Lia",
    "Liana", "Lidya", "Lila", "Lina", "Linda", "Lintang", "Lisa", "Livia", "Lulu",
    "Lutfia", "Maharani", "Mahira", "Maia", "Maira", "Maisarah", "Mala", "Malika",
    "Manda", "Marina", "Marisa", "Marlina", "Marsha", "Maryam", "Maya", "Mayang",
    "Meilani", "Melani", "Melati", "Mellisa", "Merry", "Meyda", "Mila", "Mira",
    "Miranda", "Monica", "Mutiara", "Nabila", "Nadia", "Nadila", "Nadira", "Naila",
    "Najwa", "Nanda", "Nandita", "Nanik", "Naomi", "Nara", "Natasya", "Natasha",
    # Additional female names - batch 2
    "Naurah", "Nayla", "Nazwa", "Nida", "Niken", "Nila", "Nina", "Nindi", "Nindy",
    "Nisa", "Nita", "Nova", "Novi", "Novia", "Novita", "Nur", "Nuria", "Nurul",
    "Nydia", "Ocha", "Okta", "Oktavia", "Olivia", "Patricia", "Permata", "Pertiwi",
    "Pinka", "Pipit", "Poppy", "Prada", "Prameswari", "Pratiwi", "Puji", "Puput",
    "Puspa", "Puspita", "Putri", "Qistina", "Qonita", "Rachel", "Rahayu", "Rahma",
    "Rahmawati", "Rahmi", "Raisa", "Raissa", "Rana", "Rani", "Rania", "Rara",
    "Rasya", "Ratih", "Ratna", "Ratu", "Raya", "Raysha", "Rebecca", "Regina",
    "Reina", "Renata", "Reni", "Resti", "Retno", "Ria", "Riana", "Rida", "Rifa",
    "Rika", "Rima", "Rina", "Rindu", "Rini", "Rinta", "Riri", "Risa", "Riska",
    "Risma", "Riyanti", "Rossa", "Rossa", "Rukmini", "Sabila", "Sabrina", "Safa",
    "Safira", "Salma", "Salsa", "Salsabila", "Sandra", "Santi", "Santika", "Sarah",
    "Sari", "Sartika", "Saskia", "Sasmita", "Savira", "Sekar", "Selly", "Sena",
    "Septi", "Sera", "Serena", "Shabrina", "Shafira", "Shahnaz", "Shinta", "Shintia",
    "Sifa", "Silvi", "Silvia", "Sinta", "Siska", "Sita", "Siti", "Sofia", "Sonia",
    "Sridevi", "Stefani", "Suci", "Sulis", "Suryani", "Susan", "Susanti", "Susi",
    "Susilawati", "Syahla", "Syakira", "Syarifa", "Syifa", "Syila", "Sylvia",
    "Tania", "Tanti", "Tantri", "Tari", "Tasya", "Tasyi", "Tati", "Teresia",
    "Tia", "Tiara", "Tika", "Tita", "Titin", "Tiyas", "Tri", "Triana", "Tuti",
    "Ulya", "Umi", "Utami", "Vania", "Vanya", "Vera", "Veronika", "Vina", "Vinca",
    "Vini", "Vira", "Vita", "Vivi", "Wanda", "Warni", "Wati", "Wening", "Wida",
    "Widya", "Widyastuti", "Wika", "Wina", "Winda", "Wira", "Wulan", "Wulandari",
    "Yana", "Yanti", "Yenny", "Yessy", "Yessi", "Yolanda", "Yulia", "Yuliana",
    "Yuliani", "Yuni", "Yunita", "Yuriko", "Yusra", "Zahra", "Zahwa", "Zalfa",
    "Zara", "Zaskia", "Zefanya", "Zhafira", "Zihan", "Zoya", "Zulaikha",
]

_MALE_COMPOUND_ROOTS = [
    "Abdi", "Abdul", "Adi", "Aditya", "Akbar", "Alif", "Alvin", "Ari", "Arief", "Arya",
    "Bagas", "Bakti", "Bara", "Bima", "Cahya", "Damar", "Dani", "Dimas", "Erlangga",
    "Fadlan", "Fahri", "Fajar", "Farrel", "Genta", "Gibran", "Hafiz", "Haris", "Ilham",
    "Iqbal", "Jafar", "Jefri", "Kresna", "Luthfi", "Maulana", "Naufal", "Pradipta",
    "Rafly", "Raka", "Rama", "Reynaldi", "Rizky", "Satria", "Tegar", "Wahyu", "Yusuf",
    "Zidan", "Zikri",
    # Additional male compound roots
    "Abizar", "Abrar", "Adhitya", "Adnan", "Adriansyah", "Affan", "Akmal", "Alfarizi",
    "Alghifari", "Alifian", "Althaf", "Ammar", "Ananta", "Andhika", "Anggara", "Anindito",
    "Aqil", "Ardana", "Ardiansyah", "Ardianto", "Arifin", "Arkan", "Aryanto", "Athar",
    "Atha", "Azriel", "Bachtiar", "Bagaskara", "Baihaqi", "Bara", "Baskara", "Bintang",
    "Bramasta", "Brilian", "Cakra", "Candra", "Daffa", "Daffino", "Damar", "Danendra",
    "Dhani", "Dharma", "Dimas", "Dirga", "Dzakwan", "Dzaky", "Ega", "Egi", "Elvano",
    "Fadhil", "Fadholi", "Fahreza", "Faiq", "Fathir", "Fauzan", "Fikri", "Firdaus",
    "Gagah", "Ghani", "Gilang", "Hafizh", "Haikal", "Hanan", "Hanif", "Harraz",
    "Hasan", "Hasyim", "Hilmi", "Ibrahim", "Ihsan", "Ilman", "Irfan", "Izzan",
    "Jibran", "Kautsar", "Keanu", "Khalif", "Labib", "Mahesa", "Malik", "Marcell",
    "Mikail", "Nabil", "Nadhif", "Naufan", "Naufal", "Nayaka", "Nazriel", "Prakasa",
    "Rafathar", "Rafif", "Raihan", "Rakha", "Rangga", "Rasya", "Rayhan", "Rifqi",
    "Rizqan", "Rizqullah", "Sakha", "Salman", "Shidqi", "Sulthan", "Tsaqif", "Wildan",
]

_FEMALE_COMPOUND_ROOTS = [
    "Adelia", "Aghnia", "Alya", "Amalia", "Andini", "Anjani", "Aqila", "Ardelia", "Aulia",
    "Azzahra", "Bilqis", "Cahya", "Cantika", "Dania", "Dewi", "Elvira", "Fadhila",
    "Fara", "Farah", "Fitri", "Ghina", "Hana", "Humaira", "Intan", "Jihan", "Kania",
    "Kirana", "Laras", "Maharani", "Maira", "Nadira", "Najwa", "Naura", "Nayla",
    "Prameswari", "Qistina", "Rahma", "Rania", "Salma", "Sekar", "Shafira", "Syifa",
    "Talitha", "Wulan", "Yasmin", "Zahra", "Zalfa",
    # Additional female compound roots
    "Adara", "Adiba", "Adila", "Adira", "Adiva", "Afifa", "Afrina", "Aghnia", "Aira",
    "Aisyah", "Alesha", "Alfiana", "Alika", "Almira", "Aluna", "Alya", "Amanda",
    "Amara", "Aminah", "Ananda", "Anindita", "Annisa", "Aqila", "Arafah", "Asyifa",
    "Aulia", "Azzahra", "Balqis", "Cahaya", "Cahyani", "Calista", "Cantika", "Chairunnisa",
    "Chika", "Dania", "Danisa", "Dara", "Dian", "Dwi", "Eka", "Eliza", "Erlita",
    "Fadhila", "Fadila", "Fakhirah", "Faranisa", "Fathia", "Fatimah", "Fauziah", "Faza",
    "Firda", "Fitria", "Fitriani", "Ghaida", "Ghassani", "Gita", "Habibah", "Hafizah",
    "Hana", "Hanifa", "Hasna", "Hazna", "Humaira", "Husna", "Indah", "Indira", "Inka",
    "Irdina", "Jihan", "Kalila", "Kamilah", "Karina", "Khadijah", "Khairunnisa", "Khalisa",
    "Kinanti", "Latifa", "Lestari", "Mahira", "Maisy", "Malika", "Maritza", "Marwa",
    "Maulida", "Mawaddah", "Mayla", "Meisya", "Meyda", "Mutia", "Mutiara", "Nabila",
    "Nada", "Nadhira", "Nadia", "Nadifa", "Nadine", "Nafisa", "Najla", "Nasywa",
    "Naura", "Nayla", "Nazifa", "Nida", "Nisrina", "Nova", "Nurul", "Putri", "Qanita",
    "Qonita", "Rafifa", "Rahma", "Raisha", "Raissa", "Rania", "Ratu", "Rizka",
    "Rizqia", "Safira", "Salwa", "Salsabila", "Shabrina", "Shafira", "Syifa", "Tsabita",
]

MALE_NAMES = _dedupe(
    _MALE_ROOTS
    + [f"Muhammad {name}" for name in _MALE_COMPOUND_ROOTS]
    + [f"Ahmad {name}" for name in _MALE_COMPOUND_ROOTS]
    + [f"Raden {name}" for name in _MALE_COMPOUND_ROOTS[:28]]
    + [f"I Made {name}" for name in _MALE_COMPOUND_ROOTS[:24]]
    + [f"Andi {name}" for name in _MALE_COMPOUND_ROOTS[:24]]
)

FEMALE_NAMES = _dedupe(
    _FEMALE_ROOTS
    + [f"Siti {name}" for name in _FEMALE_COMPOUND_ROOTS]
    + [f"Nur {name}" for name in _FEMALE_COMPOUND_ROOTS]
    + [f"Putri {name}" for name in _FEMALE_COMPOUND_ROOTS]
    + [f"Dewi {name}" for name in _FEMALE_COMPOUND_ROOTS[:32]]
    + [f"Ni Luh {name}" for name in _FEMALE_COMPOUND_ROOTS[:24]]
)

_FAMILY_NAMES = [
    # Jawa / umum
    "Santoso", "Setiawan", "Kurniawan", "Purnomo", "Widodo", "Susanto", "Nugroho",
    "Hartono", "Pranoto", "Suryanto", "Wibowo", "Prasetyo", "Gunawan", "Utama", "Saputra",
    "Putra", "Pratama", "Wijaya", "Kusuma", "Hidayat", "Sutrisno", "Suharto", "Suwandi",
    "Suryadi", "Saptono", "Sudarma", "Sukoco", "Sukamto", "Sasmita", "Sanjaya", "Suryana",
    "Wicaksono", "Wiryawan", "Winarno", "Wahyudi", "Warsito", "Darsono", "Haryanto",
    "Hermawan", "Irawan", "Jatmiko", "Kusnadi", "Lukito", "Mardianto", "Mulyono",
    "Prabowo", "Priyanto", "Raharjo", "Riyanto", "Sasongko", "Sudrajat", "Suherman",
    "Sukmana", "Sutanto", "Tjahjono", "Waskito", "Yulianto",
    # Sunda / Betawi
    "Permana", "Sopian", "Somantri", "Koswara", "Rukmana", "Sukmana", "Abdurahman",
    "Saepudin", "Rohmat", "Solehudin", "Taufik", "Junaedi", "Herdiana", "Kusmayadi",
    "Firmansyah", "Fauzi", "Ramdan", "Maulana", "Mulyana", "Hidayatullah", "Syamsudin",
    "Sobari", "Suryaman", "Nurdin", "Komarudin", "Jamaludin", "Ramdani", "Nurjaman",
    # Batak / Nias / Sumatra clans
    "Sihombing", "Napitupulu", "Situmorang", "Sitompul", "Hutabarat", "Siahaan", "Tambunan",
    "Sinaga", "Simanjuntak", "Sitorus", "Manurung", "Pardede", "Panjaitan", "Hutagalung",
    "Tampubolon", "Lumbantoruan", "Lumbanraja", "Silalahi", "Saragih", "Damanik", "Purba",
    "Ginting", "Tarigan", "Sembiring", "Peranginangin", "Barus", "Siregar", "Harahap",
    "Lubis", "Nasution", "Ritonga", "Rangkuti", "Batubara", "Hutasoit", "Marbun",
    # Minang / Melayu / Aceh
    "Syahputra", "Syahrial", "Syafri", "Zulkarnain", "Zulfikar", "Zainuddin", "Iskandar",
    "Mansyur", "Mahmud", "Hamzah", "Rasyid", "Fadillah", "Fauzan", "Khairul", "Ridwan",
    "Rahman", "Hakim", "Salim", "Wahid", "Abdullah", "Karim", "Tanjung", "Malik",
    "Yusuf", "Ibrahim", "Hasibuan", "Daulay", "Matondang", "Alamsyah", "Piliang",
    "Chaniago", "Koto", "Sikumbang", "Guci", "Jambak", "Melayu", "Syahreza",
    # Sulawesi / Kalimantan / Bali / Timur
    "Latuconsina", "Pattimura", "Panggabean", "Pangemanan", "Lumintang", "Roring", "Wowor",
    "Mokodompit", "Mangindaan", "Tandirerung", "Pabentengan", "Sombolinggi", "Tandi",
    "Daeng", "Petta", "Baharuddin", "Mappanyukki", "Arung", "Pangerang", "Sultan",
    "Antasari", "Suriansyah", "Rahadi", "Adnyana", "Wirawan", "Mahendra", "Wardana",
    "Suardika", "Artana", "Pradnyana", "Darmayasa", "Wijana", "Kusuma", "Latu",
    "Tetelepta", "Manuhutu", "Sahertian", "Rumbiak", "Numberi", "Wanggai", "Kambu",
    "Korwa", "Mofu", "Suebu", "Adoe", "Tallo", "Bani", "Leki", "Kelen", "Koten",
    # Chinese-Indonesian / modern common surnames
    "Tan", "Lim", "Ong", "Tjandra", "Wijanto", "Gunawan", "Halim", "Kosasih", "Salim",
    "Susanto", "Hendrawan", "Wibisono", "Wongso", "Liem", "Tanuwijaya", "Setiadi",
    "Winata", "Santoso", "Halimanto", "Kurnia", "Hartawan", "Wijaya",
    # Extra Surnames
    "Pradana", "Mahendra", "Baskoro", "Wibisono", "Pangestu", "Suryanegara", "Wiratama",
    "Adiguna", "Siregar", "Lubis", "Tanjung", "Chaniago", "Simanjuntak", "Sihombing",
    "Sinaga", "Silalahi", "Tampubolon", "Marpaung", "Sitorus", "Ginting", "Tarigan",
    "Sembiring", "Pasaribu", "Pohan", "Rambe", "Dalimunthe", "Hutasoit", "Hutauruk",
    "Samosir", "Manalu", "Nainggolan", "Ritonga", "Simatupang", "Tambunan", "Hutagalung",
    "Panggabean", "Aritonang", "Silitonga", "Pakpahan", "Harianja", "Hutapea", "Siburian",
    "Sihotang", "Situmorang", "Siagian", "Manik", "Saragih", "Damanik", "Purba", "Haloho",
    "Munthe", "Panjaitan", "Siahaan", "Gurning", "Rajagukguk", "Simbolon", "Malau",
    "Sinambela", "Pardosi", "Sihaloho", "Nadapdap", "Wahyudi", "Aryanto", "Hermanto",
    "Budiarto", "Iswanto", "Haryadi", "Kusmanto", "Prasetya", "Hadi", "Wardhana", "Setiadi",
    "Sudibyo", "Handoko", "Kuncoro", "Budiman", "Cahyono", "Pamungkas", "Susetyo", "Suratno",
    "Hariyanto", "Mulyadi", "Wirawan", "Kuswanto", "Sanjaya", "Syahputra", "Mustofa",
    "Rachman", "Syamsuddin", "Yulianto", "Rusmanto", "Sudarsono", "Darmawan", "Ghozali",
    "Hakim", "Wahid", "Sutanto", "Santika", "Pranata", "Aditya", "Yuwono", "Purnawan",
    "Hardi", "Nugroho", "Setiawan", "Wijayanto", "Cahyadi", "Yuniarto", "Murdiono",
    "Mulyawan", "Sugiarto", "Subagyo", "Wibowo", "Wiyono", "Basuki", "Suwito", "Harjanto",
    "Haryono", "Nugraha", "Budiyanto", "Susilo", "Sudarman", "Pramono", "Sutrisno",
]

_MALE_SECOND_NAMES = [
    "Adinata", "Adiputra", "Aditama", "Alamsyah", "Anugrah", "Ardiansyah", "Aryanto",
    "Baskara", "Cahyadi", "Darmawan", "Dewantara", "Dwianto", "Ekaputra", "Firmansyah",
    "Hadiansyah", "Hermawan", "Hidayat", "Ibrahim", "Kusnanto", "Laksono", "Mahardika",
    "Maulana", "Nugraha", "Pamungkas", "Pangestu", "Pradana", "Prakoso", "Pramudya",
    "Prasetya", "Ramadhan", "Ramadani", "Ramdani", "Rinaldi", "Saputra", "Setiawan",
    "Suryaputra", "Syahputra", "Wicaksana", "Wijanarko", "Wiryawan", "Yudhistira",
    # Additional male second names
    "Adibrata", "Aditya", "Alfari", "Alfarizi", "Anshori", "Arbangi", "Ardiyanto",
    "Ariyanto", "Assegaf", "Azhari", "Baharuddin", "Bahri", "Baidowi", "Basalamah",
    "Baskoro", "Budiman", "Cahyono", "Cahyanto", "Chaniago", "Damanhuri", "Darmadi",
    "Erlangga", "Fachruddin", "Fadillah", "Fajri", "Fauzan", "Fauzi", "Firdaus",
    "Ghozali", "Gumilar", "Hafiz", "Hakim", "Hamdani", "Hamzah", "Handoko", "Hardianto",
    "Hariyadi", "Hariyanto", "Haryono", "Hermanto", "Hidayatullah", "Irawan", "Iskandar",
    "Ismail", "Iswanto", "Kusnadi", "Kusuma", "Kusumo", "Kuswanto", "Laksana", "Lestari",
    "Mahendra", "Mahmud", "Mardianto", "Maulana", "Maulidi", "Mubarok", "Mulyadi",
    "Mulyono", "Muna", "Mundir", "Munir", "Murdani", "Mustafa", "Mutaqin", "Muttaqin",
    "Muzakki", "Nashir", "Nugroho", "Nurhadi", "Pambudi", "Pamungkas", "Perdana",
    "Pradipta", "Prakoso", "Pramana", "Pramono", "Pranata", "Pranoto", "Prasetya",
    "Prasetyo", "Pratama", "Prawira", "Prayitno", "Purnomo", "Purwanto", "Raditya",
    "Raharjo", "Rakhman", "Ramadhan", "Rizaldi", "Rizqullah", "Rohman", "Rozi",
    "Rusmana", "Rustam", "Sabeni", "Sadikin", "Safi'i", "Salim", "Sanjaya", "Saputra",
    "Setyawan", "Setiyono", "Subagyo", "Subandi", "Sugiarto", "Suharto", "Sulaiman",
    "Sulistyo", "Sumarsono", "Supriyadi", "Suryadi", "Suryanto", "Susanto", "Susilo",
    "Suwandi", "Syafi'i", "Syahroni", "Syamsuddin", "Syamsuri", "Syarifudin", "Taufiq",
    "Utama", "Utomo", "Wahyono", "Wahyudi", "Wardana", "Wardhana", "Waskito", "Wibisono",
    "Wicaksono", "Widianto", "Widodo", "Wiyono", "Yulianto", "Yuniarto", "Zaelani",
]

_FEMALE_SECOND_NAMES = [
    "Amandari", "Ambarwati", "Anandita", "Anjani", "Anggraini", "Apsari", "Ariani",
    "Cahyani", "Damayanti", "Dewanti", "Diah", "Fitriani", "Hapsari", "Kusumawati",
    "Larasati", "Lestari", "Maheswari", "Maharani", "Mayang", "Melati", "Ningrum",
    "Permatasari", "Prameswari", "Puspitasari", "Rahmawati", "Rahayu", "Ratnasari",
    "Safitri", "Saraswati", "Sekarsari", "Wulandari", "Yuliani", "Yuniarti", "Zahra",
    # Additional female second names
    "Adiningrum", "Adisty", "Afifah", "Afrina", "Agustin", "Agustina", "Aisyah",
    "Alawiyah", "Amalia", "Amanda", "Amini", "Ananda", "Andini", "Anggraeni",
    "Anindita", "Annisa", "Aprilia", "Aprilianti", "Ardiyanti", "Arifah", "Arini",
    "Ariyanti", "Arofah", "Ashari", "Asmara", "Astuti", "Auliya", "Avila",
    "Azhari", "Azzahra", "Badriyah", "Baroroh", "Cahayani", "Cahyanti", "Chairani",
    "Daryanti", "Deswita", "Dewanti", "Dewanti", "Diniari", "Fadhilah", "Fadilla",
    "Fajriyah", "Farida", "Fatimah", "Fauziah", "Fauziyah", "Febriana", "Febriani",
    "Fikriyah", "Fitriana", "Fitriani", "Fitriyani", "Gustina", "Hafizhah", "Hajar",
    "Halimah", "Hamidah", "Handayani", "Hapsari", "Haryanti", "Hasanah", "Hayati",
    "Hidayah", "Hidayati", "Husna", "Husniyah", "Indarwati", "Indriyani", "Inayah",
    "Irmawati", "Islamiyah", "Istiqomah", "Jannah", "Julianti", "Kalsum", "Kamila",
    "Kamilah", "Karimah", "Karisma", "Kasanah", "Khaerunnisa", "Khasanah", "Khatimah",
    "Khoiriyah", "Khoirunnisa", "Khomsah", "Kinanti", "Kiptiyah", "Komalasari",
    "Kusuma", "Kusumaningrum", "Laili", "Lailiya", "Latifah", "Lestari", "Lutfiani",
    "Luthfiyah", "Maghfiroh", "Maharani", "Mahmudah", "Maimunah", "Mardianti",
    "Mardiyah", "Marlina", "Marwati", "Maryanti", "Maulida", "Maulidia", "Mawarni",
    "Meliana", "Mulyani", "Mulyanti", "Munasaroh", "Munawaroh", "Mursyidah",
    "Muthoharoh", "Mutiara", "Muzdalifah", "Nabilah", "Nafisah", "Nahar", "Najihah",
    "Nisa", "Nugraheni", "Nuraini", "Nurhayati", "Nursanti", "Oktavia", "Oktaviani",
    "Pertiwi", "Pramesti", "Pratiwi", "Pujianti", "Pujowati", "Purnamasari", "Purwanti",
    "Puspita", "Puspitawati", "Putranti", "Rahmawati", "Rahmawati", "Rahmayanti",
    "Ramadhani", "Ramadhanti", "Ratnasari", "Retnowati", "Riyanti", "Rizkiyah",
    "Rochmah", "Rofiqoh", "Rohmah", "Rohmawati", "Rosida", "Rosyidah", "Safitri",
    "Salsabila", "Salsabila", "Salsabilla", "Sari", "Sartika", "Savitri", "Setyawati",
    "Shalihah", "Sholikah", "Suciati", "Sulastri", "Sulistiyani", "Sumiati", "Suminar",
    "Suprihatin", "Suryani", "Suryanti", "Susanti", "Susilowati", "Syafira", "Syifa",
    "Tari", "Utami", "Wahyuningsih", "Wardani", "Widyawati", "Wijayanti", "Wulandari",
    "Yuliana", "Yulianti", "Yuniar", "Yunita", "Zahira", "Zahro", "Zainab", "Zakiyah",
]

NEUTRAL_LAST_NAMES = _dedupe(
    _FAMILY_NAMES
    + [
        "Aditya", "Aksara", "Ananda", "Anggara", "Ardana", "Ardhani", "Baswara", "Cakra",
        "Cendana", "Dharma", "Dirgantara", "Erlangga", "Fadillah", "Gemilang", "Hutama",
        "Jatmika", "Kencana", "Kirana", "Kusuma", "Laksana", "Mahardika", "Mandala",
        "Narayana", "Nugraha", "Pamungkas", "Pangestu", "Permadi", "Pradipta", "Prakasa",
        "Prameswara", "Pranata", "Raharja", "Ramdani", "Samudra", "Sanjaya", "Sasmita",
        "Sentosa", "Surya", "Swastika", "Tirta", "Waskita", "Wicaksana", "Wijaya",
        "Wiratama", "Yudistira",
    ]
)

MALE_LAST_NAMES = _dedupe(
    _FAMILY_NAMES
    + _MALE_SECOND_NAMES
    + [f"{name} Putra" for name in _MALE_COMPOUND_ROOTS]
    + [f"{name} Pratama" for name in _MALE_COMPOUND_ROOTS]
    + [f"{name} Saputra" for name in _MALE_COMPOUND_ROOTS[:36]]
    + [f"{name} Ramadhan" for name in _MALE_COMPOUND_ROOTS[:24]]
)

FEMALE_LAST_NAMES = _dedupe(
    _FEMALE_SECOND_NAMES
    + ["Sari", "Lestari", "Rahayu", "Safitri", "Wulandari", "Permatasari", "Rahmawati", "Maharani", "Pratiwi"]
    + [f"{name} Putri" for name in _FEMALE_COMPOUND_ROOTS]
    + [f"{name} Lestari" for name in _FEMALE_COMPOUND_ROOTS]
    + [f"{name} Safitri" for name in _FEMALE_COMPOUND_ROOTS[:36]]
    + [f"{name} Azzahra" for name in _FEMALE_COMPOUND_ROOTS[:24]]
)


_COMMON_MALE_FIRST_NAMES = _dedupe([
    "Budi", "Agus", "Wahyu", "Doni", "Hendra", "Bayu", "Fajar", "Rizky", "Arif", "Teguh",
    "Dimas", "Galih", "Bagus", "Eko", "Rudi", "Rizal", "Rian", "Rio", "Ari", "Adit",
    "Bima", "Rama", "Rangga", "Satria", "Gilang", "Bagas", "Ahmad", "Farhan", "Reza",
    "Daffa", "Aditya", "Andika", "Naufal", "Raihan", "Iqbal", "Yusuf", "Kevin", "Bryan",
    "Daniel", "David", "Ryan", "Rendy", "Angga", "Denny", "Irfan", "Rahmat", "Ilham",
])

_COMMON_FEMALE_FIRST_NAMES = _dedupe([
    "Siti", "Dewi", "Rina", "Rini", "Maya", "Lina", "Indah", "Putri", "Ayu", "Dian",
    "Fitri", "Anisa", "Annisa", "Aulia", "Nabila", "Nadia", "Intan", "Nurul", "Nisa",
    "Rani", "Rara", "Tiara", "Citra", "Vina", "Vani", "Dinda", "Laras", "Wulan",
    "Sarah", "Aisyah", "Zahra", "Salsabila", "Amelia", "Karina", "Nadya", "Fara",
])

_COMMON_LAST_NAMES = _dedupe([
    "Santoso", "Setiawan", "Kurniawan", "Purnomo", "Widodo", "Susanto", "Nugroho",
    "Hartono", "Prasetyo", "Gunawan", "Utama", "Saputra", "Putra", "Pratama", "Wijaya",
    "Kusuma", "Hidayat", "Wicaksono", "Hermawan", "Irawan", "Raharjo", "Permana",
    "Firmansyah", "Fauzi", "Maulana", "Mulyana", "Nurdin", "Ramdan", "Ramdani",
    "Rahman", "Hakim", "Salim", "Abdullah", "Karim", "Ridwan", "Aditya", "Nugraha",
    "Pamungkas", "Pangestu", "Pradana", "Mahendra", "Darmawan", "Cahyadi",
])

_COMMON_FEMALE_LAST_NAMES = _dedupe([
    "Lestari", "Safitri", "Rahmawati", "Permatasari", "Puspitasari", "Wulandari", "Sari",
    "Maharani", "Anggraini", "Fitriani", "Kusumawati", "Damayanti", "Rahayu", "Pratiwi",
    "Handayani", "Susanti", "Yuliani", "Yuniarti", "Azzahra", "Nuraini", "Oktaviani",
])


def _weighted_choice(common_items: list[str], all_items: list[str], common_weight: float = 0.85) -> str:
    if common_items and random.random() < common_weight:
        return random.choice(common_items)
    return random.choice(all_items)


_FEMININE_LAST_NAME_PARTS = {
    "lestari", "sari", "rahayu", "safitri", "wulandari", "permatasari", "rahmawati",
    "maharani", "pratiwi", "azzahra", "fitriani", "puspitasari", "anggraini",
    "damayanti", "handayani", "susanti", "yuliani", "yuniarti", "nuraini", "oktaviani",
}


def _looks_feminine_last_name(value: str) -> bool:
    parts = {part.casefold() for part in value.split()}
    return bool(parts & _FEMININE_LAST_NAME_PARTS)


def _pick_name(chosen_gender: str, used: set[str], blocked: set[str] | None = None) -> str:
    first_names = MALE_NAMES if chosen_gender == "male" else FEMALE_NAMES
    gendered_last_names = MALE_LAST_NAMES if chosen_gender == "male" else FEMALE_LAST_NAMES
    common_first_names = _COMMON_MALE_FIRST_NAMES if chosen_gender == "male" else _COMMON_FEMALE_FIRST_NAMES
    common_last_names = _COMMON_LAST_NAMES if chosen_gender == "male" else _COMMON_FEMALE_LAST_NAMES
    last_names = gendered_last_names + NEUTRAL_LAST_NAMES
    last_name_weight = 0.85 if chosen_gender == "male" else 0.97
    blocked_names = {name.casefold() for name in (blocked or set())}

    for _ in range(80):
        first_name = _weighted_choice(common_first_names, first_names)
        last_name = _weighted_choice(common_last_names, last_names, last_name_weight)
        if chosen_gender == "male" and _looks_feminine_last_name(last_name):
            continue
        full_name = f"{first_name} {last_name}"
        if full_name not in used and full_name.casefold() not in blocked_names:
            used.add(full_name)
            return full_name

    fallback_last_names = [name for name in last_names if chosen_gender != "male" or not _looks_feminine_last_name(name)]
    full_name = f"{random.choice(first_names)} {random.choice(fallback_last_names or last_names)}"
    used.add(full_name)
    return full_name


def get_random_names(n: int, gender: str = "mixed", blocked_names: set[str] | None = None) -> list[tuple[str, str]]:
    """
    Get n random Indonesian full names with gender.

    gender: 'male', 'female', or 'mixed'
    blocked_names: names to avoid reusing for the same form/link.
    Returns list of (full_name, gender) tuples, e.g. ('Budi Santoso', 'male').
    """
    if n <= 0:
        return []
    if gender not in {"male", "female", "mixed"}:
        raise ValueError("gender must be 'male', 'female', or 'mixed'")

    results: list[tuple[str, str]] = []
    used: set[str] = set()

    for _ in range(n):
        if gender == "male":
            chosen_gender = "male"
        elif gender == "female":
            chosen_gender = "female"
        else:
            chosen_gender = random.choice(["male", "female"])

        results.append((_pick_name(chosen_gender, used, blocked_names), chosen_gender))

    return results
