import requests, csv, json, datetime
from requests.exceptions import HTTPError
import os
import pprint

"""
This function gets the previous election's certified results.

Office ID Examples: These Office IDs are unique at the national level (across all states):

OfficeID    OfficeName
G           Governor 
H           U.S. House
I           Amendment, Ballot Measure, Initiative, Proposal, Proposition, Referendum or Question
P           President
S           U.S. Senate
Y           State House, State Assembly, General Assembly or House of Delegates
Z           State Senate
"""

returnformat = "json"
offices = "P"
resultslevel = "FIPSCode"

timestamp = str(datetime.datetime.now()).replace(" ", "_")

headers = {
    "x-api-key": os.getenv("AP_API_KEY"),
    "Content-Type": "application/json"
}

parsedresultsfile = 'apResults.csv'
result = None
raw_url = "https://api.ap.org/v2/elections/2020-11-03?level=%s&format=json&officeID=%s&resultsType=c" % (resultslevel, offices)

print("Retrieving from %s and writing output to %s" % (raw_url, parsedresultsfile))

# reporting units
RU_keys = [ 'fipsCode']
# candidates
cand_keys = ['last',  'party',  'votepct' ]

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
        if (RU['level'] == "FIPSCode") and (RU.get('fipsCode') != None):
            for key in RU_keys:
                try:
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