// Bangladesh administrative locations: Division → District → Upazila / Thana.
// Used by the checkout form for cascading Division / District / Area selects.
//
// Keys are the short division names stored on orders (order.customer.division),
// e.g. 'Dhaka' rather than 'Dhaka Division'.

export const BD_LOCATIONS = {
    Dhaka: {
        Dhaka: ['Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Mohammadpur', 'Tejgaon', 'Motijheel', 'Paltan', 'Ramna', 'Shahbagh', 'Khilgaon', 'Badda', 'Bhatara', 'Savar', 'Dhamrai', 'Keraniganj', 'Dohar', 'Nawabganj'],
        Gazipur: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Sreepur', 'Kapasia', 'Kaliganj'],
        Narayanganj: ['Narayanganj Sadar', 'Rupganj', 'Sonargaon', 'Araihazar', 'Bandar', 'Fatullah', 'Siddhirganj'],
        Munshiganj: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Louhajang', 'Gazaria', 'Tongibari'],
        Manikganj: ['Manikganj Sadar', 'Singair', 'Saturia', 'Ghior', 'Daulatpur', 'Shibalaya', 'Harirampur'],
        Narsingdi: ['Narsingdi Sadar', 'Palash', 'Shibpur', 'Raipura', 'Belabo', 'Monohardi'],
        Faridpur: ['Faridpur Sadar', 'Boalmari', 'Alphadanga', 'Modhukhali', 'Nagarkanda', 'Saltha', 'Bhanga', 'Sadarpur', 'Charbhadrasan'],
        Madaripur: ['Madaripur Sadar', 'Shibchar', 'Rajoir', 'Kalkini', 'Dasar'],
        Shariatpur: ['Shariatpur Sadar', 'Naria', 'Zanjira', 'Bhedarganj', 'Damudya', 'Gosairhat'],
        Rajbari: ['Rajbari Sadar', 'Pangsha', 'Kalukhali', 'Baliakandi', 'Goalanda'],
        Gopalganj: ['Gopalganj Sadar', 'Tungipara', 'Kotalipara', 'Muksudpur', 'Kasiani'],
        Tangail: ['Tangail Sadar', 'Mirzapur', 'Delduar', 'Nagarpur', 'Basail', 'Kalihati', 'Ghatail', 'Gopalpur', 'Madhupur', 'Dhanbari', 'Bhuapur', 'Sakhipur'],
    },
    Chattogram: {
        Chattogram: ['Kotwali', 'Panchlaish', 'Double Mooring', 'Halishahar', 'Patenga', 'Pahartali', 'Akbar Shah', 'Khulshi', 'Bayezid', 'Hathazari', 'Rauzan', 'Rangunia', 'Patiya', 'Banshkhali', 'Chandanaish', 'Anwara', 'Satkania', 'Lohagara', 'Fatickchhari', 'Sitakunda', 'Mirsharai', 'Sandwip'],
        "Cox's Bazar": ["Cox's Bazar Sadar", 'Ukhiya', 'Teknaf', 'Ramu', 'Chakaria', 'Pekua', 'Maheshkhali', 'Kutubdia', 'Eidgaon'],
        Cumilla: ['Cumilla Sadar', 'Sadar South', 'Chauddagram', 'Laksam', 'Barura', 'Debidwar', 'Muradnagar', 'Daudkandi', 'Chandina', 'Brahmanpara', 'Burichang', 'Meghna', 'Homna', 'Titas', 'Monohargonj', 'Nangalkot', 'Lalmai'],
        Brahmanbaria: ['Brahmanbaria Sadar', 'Kasba', 'Akhaura', 'Nabinagar', 'Ashuganj', 'Sarail', 'Nasirnagar', 'Bancharampur', 'Bijoynagar'],
        Noakhali: ['Noakhali Sadar (Sudharam)', 'Begumganj', 'Chatkhil', 'Senbagh', 'Companiganj', 'Hatiya', 'Kabirhat', 'Sonaimuri', 'Subarnachar'],
        Feni: ['Feni Sadar', 'Daganbhuiyan', 'Chhagalnaiya', 'Parshuram', 'Fulgazi', 'Sonagazi'],
        Lakshmipur: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
        Chandpur: ['Chandpur Sadar', 'Hajiganj', 'Shahrasti', 'Matlab North', 'Matlab South', 'Faridganj', 'Haimchar', 'Kachua'],
        Rangamati: ['Rangamati Sadar', 'Kaptai', 'Kawkhali', 'Baghaichhari', 'Langadu', 'Naniarchar', 'Barkal', 'Juraichhari', 'Belaichhari', 'Rajasthali'],
        Bandarban: ['Bandarban Sadar', 'Ruma', 'Thanchi', 'Rowangchhari', 'Alikadam', 'Lama', 'Naikhongchhari'],
        Khagrachhari: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Mahalchhari', 'Lakshmichhari', 'Guimara'],
    },
    Rajshahi: {
        Rajshahi: ['Boalia', 'Rajputana', 'Motihar', 'Shah Makhdum', 'Paba', 'Puthia', 'Godagari', 'Tanore', 'Mohanpur', 'Bagmara', 'Durgapur', 'Charghat', 'Bagha'],
        Bogura: ['Bogura Sadar', 'Shajahanpur', 'Sherpur', 'Dhunat', 'Shibganj', 'Gabtali', 'Kahaloo', 'Nandigram', 'Dupchanchia', 'Adamdighi', 'Sariakandi', 'Sonatala'],
        Pabna: ['Pabna Sadar', 'Ishwardi', 'Atgharia', 'Chatmohar', 'Bhangura', 'Faridpur', 'Bera', 'Santhia', 'Sujanagar'],
        Sirajganj: ['Sirajganj Sadar', 'Shahjadpur', 'Ullapara', 'Raiganj', 'Tarash', 'Kazipur', 'Kamarkhanda', 'Belkuchi', 'Chauhali'],
        Natore: ['Natore Sadar', 'Singra', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Bagatipara', 'Naldanga'],
        Naogaon: ['Naogaon Sadar', 'Raninagar', 'Atrai', 'Mahadevpur', 'Dhamoirhat', 'Patnitala', 'Badalgachhi', 'Porsha', 'Sapahar', 'Niamatpur', 'Manda'],
        Joypurhat: ['Joypurhat Sadar', 'Panchbibi', 'Akkelpur', 'Khetlal', 'Kalai'],
        Chapainawabganj: ['Chapainawabganj Sadar', 'Shibganj', 'Gomastapur', 'Nachole', 'Bholahat'],
    },
    Khulna: {
        Khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Boyra', 'Batiaghata', 'Rupsha', 'Dighalia', 'Phultala', 'Dumuria', 'Paikgachha', 'Koyra', 'Dacope', 'Terokhada'],
        Jashore: ['Jashore Sadar', 'Jhikargachha', 'Sharsha', 'Chaugachha', 'Manirampur', 'Abhaynagar', 'Bagherpara', 'Keshabpur'],
        Kushtia: ['Kushtia Sadar', 'Khoksa', 'Kumarkhali', 'Mirpur', 'Bheramara', 'Daulatpur'],
        Satkhira: ['Satkhira Sadar', 'Kalaroa', 'Tala', 'Debhata', 'Kaliganj', 'Assasuni', 'Shyamnagar'],
        Jhenaidah: ['Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa', 'Harinakunda'],
        Bagerhat: ['Bagerhat Sadar', 'Fakirhat', 'Mollahat', 'Chitalmari', 'Kachua', 'Rampal', 'Mongla', 'Morelganj', 'Sharankhola'],
        Chuadanga: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
        Meherpur: ['Meherpur Sadar', 'Mujibnagar', 'Gangni'],
        Narail: ['Narail Sadar', 'Lohagara', 'Kalia'],
        Magura: ['Magura Sadar', 'Sreepur', 'Shalikha', 'Mohammadpur'],
    },
    Barishal: {
        Barishal: ['Kotwali', 'Airport', 'Kaunia', 'Babuganj', 'Wazirpur', 'Gournadi', 'Agailjhara', 'Mehendiganj', 'Muladi', 'Hijla', 'Bakerganj', 'Banaripara'],
        Patuakhali: ['Patuakhali Sadar', 'Dumki', 'Mirzaganj', 'Bauphal', 'Galachipa', 'Dashmina', 'Kalapara (Kuakata)', 'Rangabali'],
        Bhola: ['Bhola Sadar', 'Daulatkhan', 'Burhanuddin', 'Lalmohan', 'Char Fasson', 'Tazumuddin', 'Manpura'],
        Pirojpur: ['Pirojpur Sadar', 'Indurkani', 'Kawkhali', 'Nesarabad (Swarupkathi)', 'Nazirpur', 'Bhandaria', 'Mathbaria'],
        Barguna: ['Barguna Sadar', 'Amtali', 'Taltali', 'Patharghata', 'Betagi', 'Bamna'],
        Jhalokathi: ['Jhalokathi Sadar', 'Nalchity', 'Rajapur', 'Kathalia'],
    },
    Sylhet: {
        Sylhet: ['Kotwali', 'Shah Poran', 'Airport', 'Zakiganj', 'Kanaighat', 'Jaintiapur', 'Gowainghat', 'Companiganj', 'Bishwanath', 'Golapganj', 'Fenchuganj', 'Balaganj', 'Osmani Nagar', 'South Surma'],
        Moulvibazar: ['Moulvibazar Sadar', 'Sreemangal', 'Kamalganj', 'Rajnagar', 'Kulaura', 'Juri', 'Barlekha'],
        Habiganj: ['Habiganj Sadar', 'Nabiganj', 'Bahubal', 'Chunarughat', 'Madhabpur', 'Lakhai', 'Ajmiriganj', 'Baniyachong', 'Shayestaganj'],
        Sunamganj: ['Sunamganj Sadar', 'Chhatak', 'Dowarabazar', 'Dharmapasha', 'Jamalganj', 'Tahirpur', 'Bishwamambharpur', 'Jagannathpur', 'Shalla', 'Derai', 'Madhyanagar', 'Shantiganj'],
    },
    Rangpur: {
        Rangpur: ['Kotwali', 'Parshuram', 'Tajhat', 'Haragach', 'Gangachhara', 'Taraganj', 'Badarganj', 'Mithapukur', 'Pirganj', 'Pirgachha', 'Kaunia'],
        Dinajpur: ['Dinajpur Sadar', 'Biral', 'Bochaganj', 'Kaharole', 'Birganj', 'Khansama', 'Chirirbandar', 'Parbatipur', 'Phulbari', 'Nawabganj', 'Birampur', 'Hakimpur (Hili)', 'Ghoraghat'],
        Gaibandha: ['Gaibandha Sadar', 'Sadullapur', 'Sundarganj', 'Gobindaganj', 'Palashbari', 'Saghata', 'Phulchhari'],
        Kurigram: ['Kurigram Sadar', 'Rajarhat', 'Phulbari', 'Nageshwari', 'Bhurungamari', 'Ulipur', 'Chilmari', 'Raomari', 'Char Rajibpur'],
        Nilphamari: ['Nilphamari Sadar', 'Saidpur', 'Domar', 'Dimla', 'Jaldhaka', 'Kishoreganj'],
        Lalmonirhat: ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram'],
        Panchagarh: ['Panchagarh Sadar', 'Tetulia', 'Boda', 'Debiganj', 'Atwari'],
        Thakurgaon: ['Thakurgaon Sadar', 'Pirganj', 'Ranisankail', 'Haripur', 'Baliadangi'],
    },
    Mymensingh: {
        Mymensingh: ['Mymensingh Sadar', 'Kotwali', 'Muktagachha', 'Fulbaria', 'Trishal', 'Bhaluka', 'Gafargaon', 'Nandail', 'Ishwarganj', 'Gauripur', 'Phulpur', 'Tarakanda', 'Haluaghat', 'Dhobaura'],
        Jamalpur: ['Jamalpur Sadar', 'Sarishabari', 'Melandohn', 'Islampur', 'Dewanganj', 'Bakshiganj', 'Madarganj'],
        Sherpur: ['Sherpur Sadar', 'Nakla', 'Nalitabari', 'Jhenaigati', 'Sreebardi'],
        Netrokona: ['Netrokona Sadar', 'Barhatta', 'Durgapur', 'Kalmakanda', 'Purbadhala', 'Kendua', 'Madan', 'Mohanganj', 'Khaliajuri', 'Atpara'],
    },
};

// Division select options, e.g. ['Dhaka', 'Chattogram', …]
export const BD_DIVISIONS = Object.keys(BD_LOCATIONS);

// Districts of a division, e.g. getDistricts('Dhaka') → ['Dhaka', 'Gazipur', …]
export const getDistricts = (division) => Object.keys(BD_LOCATIONS[division] || {});

// Upazilas / thanas of a district, e.g. getAreas('Dhaka', 'Dhaka') → ['Dhanmondi', …]
export const getAreas = (division, district) => (BD_LOCATIONS[division] || {})[district] || [];

// True only for Dhaka city (used to default the "Inside Dhaka" delivery zone).
export const isInsideDhaka = (division, district) => division === 'Dhaka' && district === 'Dhaka';
