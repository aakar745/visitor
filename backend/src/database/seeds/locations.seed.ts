import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Country, CountryDocument } from '../schemas/country.schema';
import { State, StateDocument } from '../schemas/state.schema';
import { City, CityDocument } from '../schemas/city.schema';
import { Pincode, PincodeDocument } from '../schemas/pincode.schema';

@Injectable()
export class LocationsSeedService {
  private readonly logger = new Logger(LocationsSeedService.name);

  constructor(
    @InjectModel(Country.name) private countryModel: Model<CountryDocument>,
    @InjectModel(State.name) private stateModel: Model<StateDocument>,
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Pincode.name) private pincodeModel: Model<PincodeDocument>,
  ) {}

  /**
   * Comprehensive India Locations Seed Data
   * Includes: 1 Country, 29 States, Major Cities, Sample PIN Codes
   */
  async seed(): Promise<void> {
    this.logger.log('🌍 Starting India Locations Seed...');

    try {
      // Check if data already exists
      const existingCountry = await this.countryModel.findOne({ code: 'IN' });
      if (existingCountry) {
        this.logger.warn('⚠️  India location data already exists. Skipping seed.');
        return;
      }

      // Create India
      const india = await this.countryModel.create({
        name: 'India',
        code: 'IN',
        isActive: true,
      });
      this.logger.log(`✅ Country created: India`);

      // India States with Cities and PIN Codes
      const locationsData = [
        {
          state: 'Gujarat',
          stateCode: 'GJ',
          cities: [
            {
              name: 'Ahmedabad',
              pincodes: [
                { pincode: '380001', area: 'Ellis Bridge' },
                { pincode: '380004', area: 'Navrangpura' },
                { pincode: '380006', area: 'Paldi' },
                { pincode: '380007', area: 'Vastrapur' },
                { pincode: '380009', area: 'Bodakdev' },
                { pincode: '380013', area: 'Satellite' },
                { pincode: '380015', area: 'Chandkheda' },
                { pincode: '380052', area: 'Bopal' },
                { pincode: '380054', area: 'Thaltej' },
                { pincode: '382350', area: 'Sanand' },
              ],
            },
            {
              name: 'Surat',
              pincodes: [
                { pincode: '395001', area: 'Chowk Bazar' },
                { pincode: '395002', area: 'Athwa Lines' },
                { pincode: '395004', area: 'Adajan' },
                { pincode: '395007', area: 'Varachha' },
                { pincode: '395010', area: 'Piplod' },
              ],
            },
            {
              name: 'Vadodara',
              pincodes: [
                { pincode: '390001', area: 'Raopura' },
                { pincode: '390002', area: 'Mandvi' },
                { pincode: '390007', area: 'Alkapuri' },
                { pincode: '390012', area: 'Manjalpur' },
              ],
            },
            {
              name: 'Rajkot',
              pincodes: [
                { pincode: '360001', area: 'Railway Station' },
                { pincode: '360002', area: 'Pedak Road' },
                { pincode: '360005', area: 'University Road' },
              ],
            },
            {
              name: 'Gandhinagar',
              pincodes: [
                { pincode: '382010', area: 'Sector 10' },
                { pincode: '382016', area: 'Sector 16' },
                { pincode: '382020', area: 'Sector 20' },
              ],
            },
          ],
        },
        {
          state: 'Maharashtra',
          stateCode: 'MH',
          cities: [
            {
              name: 'Mumbai',
              pincodes: [
                { pincode: '400001', area: 'Fort' },
                { pincode: '400020', area: 'Churchgate' },
                { pincode: '400026', area: 'Colaba' },
                { pincode: '400050', area: 'Bandra' },
                { pincode: '400051', area: 'Andheri East' },
                { pincode: '400058', area: 'Andheri West' },
                { pincode: '400101', area: 'Borivali' },
              ],
            },
            {
              name: 'Pune',
              pincodes: [
                { pincode: '411001', area: 'Shivaji Nagar' },
                { pincode: '411004', area: 'Deccan' },
                { pincode: '411007', area: 'Aundh' },
                { pincode: '411028', area: 'Kothrud' },
                { pincode: '411038', area: 'Hinjewadi' },
              ],
            },
            {
              name: 'Nagpur',
              pincodes: [
                { pincode: '440001', area: 'Sitabuldi' },
                { pincode: '440008', area: 'Civil Lines' },
                { pincode: '440010', area: 'Dharampeth' },
              ],
            },
          ],
        },
        {
          state: 'Delhi',
          stateCode: 'DL',
          cities: [
            {
              name: 'New Delhi',
              pincodes: [
                { pincode: '110001', area: 'Connaught Place' },
                { pincode: '110016', area: 'Lajpat Nagar' },
                { pincode: '110019', area: 'Defence Colony' },
                { pincode: '110024', area: 'Hauz Khas' },
                { pincode: '110029', area: 'Dwarka' },
                { pincode: '110037', area: 'Rohini' },
                { pincode: '110085', area: 'Saket' },
              ],
            },
          ],
        },
        {
          state: 'Karnataka',
          stateCode: 'KA',
          cities: [
            {
              name: 'Bangalore',
              pincodes: [
                { pincode: '560001', area: 'MG Road' },
                { pincode: '560017', area: 'Jayanagar' },
                { pincode: '560027', area: 'Indiranagar' },
                { pincode: '560034', area: 'Koramangala' },
                { pincode: '560066', area: 'Whitefield' },
                { pincode: '560100', area: 'Electronic City' },
              ],
            },
            {
              name: 'Mysore',
              pincodes: [
                { pincode: '570001', area: 'Mysore City' },
                { pincode: '570009', area: 'Vijayanagar' },
              ],
            },
          ],
        },
        {
          state: 'Tamil Nadu',
          stateCode: 'TN',
          cities: [
            {
              name: 'Chennai',
              pincodes: [
                { pincode: '600001', area: 'Parrys' },
                { pincode: '600020', area: 'T. Nagar' },
                { pincode: '600028', area: 'Mylapore' },
                { pincode: '600034', area: 'Kodambakkam' },
                { pincode: '600096', area: 'Tambaram' },
              ],
            },
            {
              name: 'Coimbatore',
              pincodes: [
                { pincode: '641001', area: 'RS Puram' },
                { pincode: '641012', area: 'Peelamedu' },
              ],
            },
          ],
        },
        {
          state: 'Rajasthan',
          stateCode: 'RJ',
          cities: [
            {
              name: 'Jaipur',
              pincodes: [
                { pincode: '302001', area: 'MI Road' },
                { pincode: '302015', area: 'Mansarovar' },
                { pincode: '302017', area: 'Malviya Nagar' },
              ],
            },
            {
              name: 'Jodhpur',
              pincodes: [
                { pincode: '342001', area: 'Jodhpur City' },
                { pincode: '342003', area: 'Ratanada' },
              ],
            },
          ],
        },
        {
          state: 'Uttar Pradesh',
          stateCode: 'UP',
          cities: [
            {
              name: 'Lucknow',
              pincodes: [
                { pincode: '226001', area: 'Hazratganj' },
                { pincode: '226010', area: 'Gomti Nagar' },
              ],
            },
            {
              name: 'Noida',
              pincodes: [
                { pincode: '201301', area: 'Sector 18' },
                { pincode: '201305', area: 'Sector 62' },
              ],
            },
            {
              name: 'Agra',
              pincodes: [
                { pincode: '282001', area: 'Agra Cantt' },
                { pincode: '282002', area: 'Sadar Bazaar' },
              ],
            },
          ],
        },
        {
          state: 'West Bengal',
          stateCode: 'WB',
          cities: [
            {
              name: 'Kolkata',
              pincodes: [
                { pincode: '700001', area: 'BBD Bagh' },
                { pincode: '700019', area: 'Park Street' },
                { pincode: '700027', area: 'Ballygunge' },
                { pincode: '700053', area: 'Salt Lake' },
              ],
            },
          ],
        },
        {
          state: 'Telangana',
          stateCode: 'TG',
          cities: [
            {
              name: 'Hyderabad',
              pincodes: [
                { pincode: '500001', area: 'Abids' },
                { pincode: '500016', area: 'Himayatnagar' },
                { pincode: '500032', area: 'Secunderabad' },
                { pincode: '500081', area: 'Gachibowli' },
              ],
            },
          ],
        },
        {
          state: 'Kerala',
          stateCode: 'KL',
          cities: [
            {
              name: 'Thiruvananthapuram',
              pincodes: [
                { pincode: '695001', area: 'City Centre' },
                { pincode: '695004', area: 'Kowdiar' },
              ],
            },
            {
              name: 'Kochi',
              pincodes: [
                { pincode: '682001', area: 'Ernakulam' },
                { pincode: '682024', area: 'Palarivattom' },
              ],
            },
          ],
        },
        {
          state: 'Madhya Pradesh',
          stateCode: 'MP',
          cities: [
            {
              name: 'Bhopal',
              pincodes: [
                { pincode: '462001', area: 'New Market' },
                { pincode: '462016', area: 'MP Nagar' },
              ],
            },
            {
              name: 'Indore',
              pincodes: [
                { pincode: '452001', area: 'MG Road' },
                { pincode: '452010', area: 'Vijay Nagar' },
              ],
            },
          ],
        },
        {
          state: 'Andhra Pradesh',
          stateCode: 'AP',
          cities: [
            {
              name: 'Visakhapatnam',
              pincodes: [
                { pincode: '530001', area: 'Dwaraka Nagar' },
                { pincode: '530016', area: 'MVP Colony' },
              ],
            },
            {
              name: 'Vijayawada',
              pincodes: [
                { pincode: '520001', area: 'Benz Circle' },
                { pincode: '520010', area: 'Bhavanipuram' },
              ],
            },
          ],
        },
        {
          state: 'Punjab',
          stateCode: 'PB',
          cities: [
            {
              name: 'Chandigarh',
              pincodes: [
                { pincode: '160001', area: 'Sector 1' },
                { pincode: '160017', area: 'Sector 17' },
                { pincode: '160036', area: 'Sector 36' },
              ],
            },
            {
              name: 'Ludhiana',
              pincodes: [
                { pincode: '141001', area: 'Civil Lines' },
                { pincode: '141008', area: 'PAU Campus' },
              ],
            },
          ],
        },
        {
          state: 'Haryana',
          stateCode: 'HR',
          cities: [
            {
              name: 'Gurgaon',
              pincodes: [
                { pincode: '122001', area: 'DLF Phase 1' },
                { pincode: '122002', area: 'DLF Phase 2' },
                { pincode: '122018', area: 'Cyber City' },
              ],
            },
            {
              name: 'Faridabad',
              pincodes: [
                { pincode: '121001', area: 'Old Faridabad' },
                { pincode: '121002', area: 'NIT' },
              ],
            },
          ],
        },
        {
          state: 'Bihar',
          stateCode: 'BR',
          cities: [
            {
              name: 'Patna',
              pincodes: [
                { pincode: '800001', area: 'Patna City' },
                { pincode: '800013', area: 'Kankarbagh' },
              ],
            },
          ],
        },
        {
          state: 'Odisha',
          stateCode: 'OR',
          cities: [
            {
              name: 'Bhubaneswar',
              pincodes: [
                { pincode: '751001', area: 'Kharvela Nagar' },
                { pincode: '751012', area: 'Nayapalli' },
              ],
            },
          ],
        },
        {
          state: 'Assam',
          stateCode: 'AS',
          cities: [
            {
              name: 'Guwahati',
              pincodes: [
                { pincode: '781001', area: 'Fancy Bazar' },
                { pincode: '781006', area: 'Ulubari' },
              ],
            },
          ],
        },
        {
          state: 'Jharkhand',
          stateCode: 'JH',
          cities: [
            {
              name: 'Ranchi',
              pincodes: [
                { pincode: '834001', area: 'Main Road' },
                { pincode: '834005', area: 'Doranda' },
              ],
            },
          ],
        },
        {
          state: 'Chhattisgarh',
          stateCode: 'CT',
          cities: [
            {
              name: 'Raipur',
              pincodes: [
                { pincode: '492001', area: 'Civil Lines' },
                { pincode: '492007', area: 'Devendra Nagar' },
              ],
            },
          ],
        },
        {
          state: 'Uttarakhand',
          stateCode: 'UT',
          cities: [
            {
              name: 'Dehradun',
              pincodes: [
                { pincode: '248001', area: 'Rajpur Road' },
                { pincode: '248003', area: 'Dalanwala' },
              ],
            },
          ],
        },
        {
          state: 'Himachal Pradesh',
          stateCode: 'HP',
          cities: [
            {
              name: 'Shimla',
              pincodes: [
                { pincode: '171001', area: 'Mall Road' },
                { pincode: '171004', area: 'Lakkar Bazaar' },
              ],
            },
          ],
        },
        {
          state: 'Jammu and Kashmir',
          stateCode: 'JK',
          cities: [
            {
              name: 'Srinagar',
              pincodes: [
                { pincode: '190001', area: 'Lal Chowk' },
                { pincode: '190010', area: 'Rajbagh' },
              ],
            },
            {
              name: 'Jammu',
              pincodes: [
                { pincode: '180001', area: 'City Centre' },
                { pincode: '180004', area: 'Gandhi Nagar' },
              ],
            },
          ],
        },
        {
          state: 'Goa',
          stateCode: 'GA',
          cities: [
            {
              name: 'Panaji',
              pincodes: [
                { pincode: '403001', area: 'Panaji City' },
                { pincode: '403002', area: 'Campal' },
              ],
            },
            {
              name: 'Margao',
              pincodes: [{ pincode: '403601', area: 'Margao City' }],
            },
          ],
        },
        {
          state: 'Manipur',
          stateCode: 'MN',
          cities: [
            {
              name: 'Imphal',
              pincodes: [
                { pincode: '795001', area: 'Imphal West' },
                { pincode: '795004', area: 'Imphal East' },
              ],
            },
          ],
        },
        {
          state: 'Meghalaya',
          stateCode: 'ML',
          cities: [
            {
              name: 'Shillong',
              pincodes: [
                { pincode: '793001', area: 'Police Bazaar' },
                { pincode: '793003', area: 'Laitumkhrah' },
              ],
            },
          ],
        },
        {
          state: 'Tripura',
          stateCode: 'TR',
          cities: [
            {
              name: 'Agartala',
              pincodes: [
                { pincode: '799001', area: 'Agartala City' },
                { pincode: '799007', area: 'NIT Area' },
              ],
            },
          ],
        },
        {
          state: 'Nagaland',
          stateCode: 'NL',
          cities: [
            {
              name: 'Kohima',
              pincodes: [{ pincode: '797001', area: 'Kohima Town' }],
            },
          ],
        },
        {
          state: 'Mizoram',
          stateCode: 'MZ',
          cities: [
            {
              name: 'Aizawl',
              pincodes: [{ pincode: '796001', area: 'Aizawl City' }],
            },
          ],
        },
        {
          state: 'Arunachal Pradesh',
          stateCode: 'AR',
          cities: [
            {
              name: 'Itanagar',
              pincodes: [{ pincode: '791111', area: 'Itanagar Capital' }],
            },
          ],
        },
        {
          state: 'Sikkim',
          stateCode: 'SK',
          cities: [
            {
              name: 'Gangtok',
              pincodes: [{ pincode: '737101', area: 'MG Marg' }],
            },
          ],
        },
      ];

      // Process each state
      for (const stateData of locationsData) {
        const state = await this.stateModel.create({
          countryId: india._id,
          name: stateData.state,
          code: stateData.stateCode,
          isActive: true,
        });

        await this.countryModel.findByIdAndUpdate(india._id, {
          $inc: { stateCount: 1 },
        });

        this.logger.log(`  ✅ State: ${state.name} (${state.code})`);

        // Process cities
        for (const cityData of stateData.cities) {
          const city = await this.cityModel.create({
            stateId: state._id,
            name: cityData.name,
            isActive: true,
          });

          await this.stateModel.findByIdAndUpdate(state._id, {
            $inc: { cityCount: 1 },
          });

          this.logger.log(`    ✅ City: ${city.name}`);

          // Process pincodes
          for (const pincodeData of cityData.pincodes) {
            await this.pincodeModel.create({
              cityId: city._id,
              pincode: pincodeData.pincode,
              area: pincodeData.area,
              isActive: true,
            });

            await this.cityModel.findByIdAndUpdate(city._id, {
              $inc: { pincodeCount: 1 },
            });
          }

          this.logger.log(
            `      ✅ ${cityData.pincodes.length} PIN codes added`,
          );
        }
      }

      // Final statistics
      const stats = {
        countries: await this.countryModel.countDocuments(),
        states: await this.stateModel.countDocuments(),
        cities: await this.cityModel.countDocuments(),
        pincodes: await this.pincodeModel.countDocuments(),
      };

      this.logger.log('');
      this.logger.log('🎉 India Locations Seed Completed Successfully!');
      this.logger.log('');
      this.logger.log('📊 Statistics:');
      this.logger.log(`   Countries: ${stats.countries}`);
      this.logger.log(`   States: ${stats.states}`);
      this.logger.log(`   Cities: ${stats.cities}`);
      this.logger.log(`   PIN Codes: ${stats.pincodes}`);
      this.logger.log('');
    } catch (error) {
      this.logger.error('❌ Error seeding India locations:', error);
      throw error;
    }
  }
}

