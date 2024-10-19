"""
This script generates county- and township-level SVG maps based on a national shapefile.

Background: This script was originally written to generate county maps for the 
2020 primaries (election20-primaries repo). It has been modified here to generate 
township-level maps for New England states. I have not tried to re-run the county 
map function. (as of Oct. 2024)

First, download the latest national cartographic boundary files from the Census Bureau:
https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html

(Older versions of this script used data from: https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html)

You will need a national county-level shapefile for county maps, and a national county subdivision shapefile for New England townships.

Save the file to the project `temp/` folder and unzip it. Then update the paths in this script accordingly.

This file also expects a separate CSV, saved to the data/ folder, that includes
* the state postal abbreviation
* the state FIPS code
* the lat/lon of the state's centroid

(For the New England states, I looked this up by hand.)

Additional resources:
* Census Bureau documentation about county subdivisions: https://www.census.gov/library/reference/code-lists/ansi.html#cousub
* Wikipedia list of geographic centers of US states: https://en.wikipedia.org/wiki/List_of_geographic_centers_of_the_United_States
* Mapshaper documentation: https://github.com/mbloch/mapshaper/wiki/Command-Reference

"""

import csv 
import subprocess
import os

try: 
	os.mkdir("src/assets/synced/towns")
	# os.mkdir("counties")
	# os.mkdir("states")
except:
	pass

# with open("FIPS_codes.csv") as f:
# 	reader = csv.DictReader(f)
# 	for row in reader:
# 		state = row["Postal code"]
# 		fips = row["FIPS code"]
# 		lat = row["Lat"]
# 		lon = row["Lon"]
# 		countyCommand = '''mapshaper cb_2018_us_county_5m.shp -proj +proj=ortho +lat_0=%s +lon_0=%s +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs -filter "STATEFP == \'%s\'" -each "id = 'fips-' + STATEFP + COUNTYFP" -o format=svg id-field=id counties/%s.svg''' % (lat,lon,fips,state)
# 		stateCommand = '''mapshaper cb_2018_us_state_5m.shp -proj +proj=ortho +lat_0=%s +lon_0=%s +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs -filter "STATEFP == \'%s\'" -o format=svg states/%s.svg''' % (lat,lon,fips,state)
# 		subprocess.call(countyCommand, shell = True)
# 		subprocess.call(stateCommand, shell = True)

with open("data/FIPS-codes-new-england.csv") as f:
	reader = csv.DictReader(f)
	for row in reader:
		print(row)
		state = row["Postal code"]
		fips = row["FIPS code"]
		lat = row["Lat"]
		lon = row["Lon"]
		townCommand = '''mapshaper temp/cb_2023_us_cousub_500k/cb_2023_us_cousub_500k.shp -proj +proj=ortho +lat_0=%s +lon_0=%s +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs -simplify 20%% keep-shapes -filter "STATEFP == \'%s\'" -each "id = 'fips-' + STATEFP + '-' + COUNTYFP + '-' + COUSUBFP" -o format=svg id-field=id src/assets/synced/towns/%s.svg''' % (lat,lon,fips,state)
		subprocess.call(townCommand, shell = True)

