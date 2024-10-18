import pandas as pd
import censusdata

detail_tables = {'B01003_001E' : 'population', "B02001_001E": "race_total", "B02001_003E": "black_total", "B03002_001E": "race_hispanic_total", "B03002_003E": "white_alone", "B03002_012E" : "hispanic_total"}
subject_tables = {"S1501_C02_015E": "percent_bachelors", "S1901_C01_012E": "median_income"}

# 5-year ACS data is often two years behind the calendar year
CENSUS_YEAR = 2022

columns = ['key']
columns.extend(list(detail_tables.values()) + list(subject_tables.values()))
pd.set_option('max_colwidth', 800)

def main():
  print("getting all data")
  data = getTownship()

  print("processing data")
  processed_data = processData(data)

  processed_data.to_csv('data/township_data.csv', index=False)


def getTownship():
  new_england_states = censusdata.geographies(censusdata.censusgeo([('state', '*')]), 'acs5', CENSUS_YEAR)

  all_states = pd.DataFrame() 

  #We want township data for these six states
  state_fips_arr = ["09", "23", "25", "33", "44", "50" ]

  # For new_england_states, get all the towns
  for state in new_england_states:
    state_fips = new_england_states[state].geo[0][1]

    if(state_fips in state_fips_arr):
        print("getting: ", state)
        subject_data = censusdata.download('acs5', CENSUS_YEAR,
                censusdata.censusgeo([('state', state_fips),
                                       ('county', '*'), ('county subdivision', '*')]),
                list(subject_tables.keys()), tabletype='subject').reset_index()
        
        detail_data = censusdata.download('acs5', CENSUS_YEAR,
                 censusdata.censusgeo([('state', state_fips),
                                       ('county', '*'), ('county subdivision', '*')]),
                list(detail_tables.keys())).reset_index()
        
        # Get correct fips for index
        subject_data['index'] = subject_data.apply(lambda row : getTownsAndFips(row['index']), axis = 1)
        detail_data['index'] = detail_data.apply(lambda row : getTownsAndFips(row['index']), axis = 1)

        # Join the tables and add to master table
        data = detail_data.merge(subject_data)
        all_states = pd.concat([all_states, data])
    else:
      continue


  # Set column names to human readable names
  results = all_states.set_axis(columns, axis=1)
  return results


# Gets a fips code from the returned geo object from census
def getTownsAndFips(geo_data):
  geo_info = geo_data.geo
  state = geo_info[0][1]
  county = geo_info[1][1]
  county_subdivision = geo_info[2][1]

  return state + '-' + county + '-' + county_subdivision

# Do the calculations we need to do on census data
def processData(data):
  data['percent_black'] = data['black_total']/data['race_total']
  data['percent_white'] = data['white_alone'] / data['race_hispanic_total']
  data['percent_hispanic'] = data['hispanic_total'] / data['race_hispanic_total']
  data['percent_bachelors'] = data['percent_bachelors'].astype(float) / 100
  return data

if __name__ == "__main__":
  main()