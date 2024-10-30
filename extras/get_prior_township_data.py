import requests, csv, datetime
from requests.exceptions import HTTPError
import os

returnformat = "json"
offices = "P"
resultslevel = "ru"

townshipLevelDataForStates = "CT,ME,MA,NH,RI,VT"

timestamp = str(datetime.datetime.now()).replace(" ", "_")

headers = {
    "x-api-key": os.getenv("AP_API_KEY"),
    "Content-Type": "application/json"
}

parsedresultsfile = 'data/townshipAPResults.csv'
result = None
raw_url = "https://api.ap.org/v2/elections/2020-11-03?level=%s&format=json&officeID=%s&resultsType=c&statePostal=%s" % (resultslevel, offices,townshipLevelDataForStates)

print("Retrieving from %s and writing output to %s" % (raw_url, parsedresultsfile))

# reporting units
RU_keys = [ 'reportingunitID', 'reportingunitName', 'state-county-subunit']
# candidates
cand_keys = ['last',  'party',  'votepct' ]

statePostalIDs = {
    'CT': "09",
    'ME': "23",
    'MA': "25",
    'NH': "33",
    'RI': "44",
    'VT': "50"
}

fieldnames = RU_keys + cand_keys
csvfile = open(parsedresultsfile, 'w')
resultwriter = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction='ignore')
resultwriter.writeheader()

result = None

try:
    response = requests.get(raw_url, headers=headers)
    response.raise_for_status()
    result = response.json()

except HTTPError as http_err:
    print(f'HTTP error occurred: {http_err}')
except Exception as err:
    print(f'Other error occurred: {err}')

print("result timestamp is %s" % result["timestamp"])

races = result["races"]

for race in races:
    reportingunits = race['reportingUnits']
    for  RU in reportingunits:
        if (RU['level'] == "subunit"):
            for key in RU_keys:
                try:
                    if key == 'state-county-subunit':
                        statePostal  = RU['statePostal']
                        race[key] = f"{statePostalIDs[statePostal]}-{RU['fipsCode'][2:]}-{RU['reportingunitID']}"
                    race[key] = RU[key]
                except KeyError:
                    pass
        
            candidates = RU['candidates']
            total = 0
            for candidate in candidates:
                total = total + candidate['voteCount']
            
            for candidate in candidates:
                for key in cand_keys:
                    try:
                        if key == 'votepct':
                            race[key] = round(candidate['voteCount']/total, 6)
                        race[key] = candidate[key]
                    except KeyError:
                        pass
            
                resultwriter.writerow(race)