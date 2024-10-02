const path = require('path');

module.exports = function(grunt) {
  grunt.registerTask('testupdate', 'Test file updates for watching with realistic election data', function() {
    const done = this.async();
    const testInterval = 10000; 
    const testDuration = 50000; 
    const filesToTest = ['build/data/bop.json', 'build/data/house.json', 'build/data/senate.json'];

    let originalContents = {};
    let currentData = {};
    let updateCount = 0;

    console.log('Starting testupdate task');
    console.log('Current working directory:', process.cwd());

    // Save original file contents and initialize current data
    filesToTest.forEach(file => {
      const filePath = path.resolve(file);
      console.log('Attempting to read file:', filePath);
      
      if (grunt.file.exists(filePath)) {
        originalContents[file] = grunt.file.read(filePath);
        console.log(`Successfully read ${file}`);
        try {
          currentData[file] = JSON.parse(originalContents[file]);
          console.log(`Successfully parsed ${file}`);
        } catch (error) {
          console.error(`Error parsing ${file}:`, error);
        }
      } else {
        console.error(`File not found: ${filePath}`);
      }
    });

    function initializeEmptyState() {
      console.log('Initializing empty state');
      // Initialize BOP data
      if (currentData['data/bop.json']) {
        currentData['data/bop.json'].house.forEach(race => {
          race.winner = "No";
        });
        currentData['data/bop.json'].senate.forEach(race => {
          race.winner = "No";
        });
      }
      // Initialize House and Senate data
      ['data/house.json', 'data/senate.json'].forEach(file => {
        if (currentData[file] && currentData[file].results) {
          currentData[file].results.forEach(race => {
            race.called = false;
            race.winnerParty = "";
            race.candidates.forEach(candidate => {
              candidate.votes = 0;
              candidate.percent = 0;
              delete candidate.winner;
            });
          });
        }
      });
    }

    function updateFiles() {
      updateCount++;
      console.log(`Update #${updateCount}`);

      // Simulate gradual reporting of results
      const reportingPercentage = Math.min(updateCount * 0.1, 1); // 10% increase per update, max 100%

      filesToTest.forEach(file => {
        if (file === 'data/bop.json') {
          updateBOPFile(reportingPercentage);
        } else {
          updateResultsFile(file, reportingPercentage);
        }

        const filePath = path.resolve(file);
        grunt.file.write(filePath, JSON.stringify(currentData[file], null, 2));
        console.log(`Updated ${file}`);
      });
    }

    function updateBOPFile(reportingPercentage) {
        if (currentData['data/bop.json']) {
          currentData['data/bop.json'].house.forEach(race => {
            if (Math.random() < reportingPercentage) {
              race.winner = Math.random() < 0.5 ? "Dem" : "GOP";
            } else {
              race.winner = "No";
            }
          });
          currentData['data/bop.json'].senate.forEach(race => {
            if (Math.random() < reportingPercentage) {
              race.winner = Math.random() < 0.5 ? "Dem" : "GOP";
            } else {
              race.winner = "No";
            }
          });
        }
      }

    function updateResultsFile(file, reportingPercentage) {
        if (currentData[file] && currentData[file].results) {
          currentData[file].results.forEach(race => {
            if (Math.random() < reportingPercentage) {
              race.called = true;
              const winner = race.candidates[Math.floor(Math.random() * race.candidates.length)];
              winner.winner = "X";
              race.winnerParty = winner.party;
  
              // Distribute votes
              const totalVotes = Math.floor(Math.random() * 1000000) + 100000;
              let remainingVotes = totalVotes;
              race.candidates.forEach((candidate, index) => {
                if (index === race.candidates.length - 1) {
                  candidate.votes = remainingVotes;
                } else {
                  candidate.votes = Math.floor(Math.random() * remainingVotes);
                  remainingVotes -= candidate.votes;
                }
                candidate.percent = candidate.votes / totalVotes;
              });
            } else {
              // If the race is not called, reset the properties but keep candidates
              race.called = false;
              race.winnerParty = "";
              race.candidates.forEach(candidate => {
                delete candidate.winner;
                candidate.votes = 0;
                candidate.percent = 0;
              });
            }
          });
        }
      }

    function restoreFiles() {
      filesToTest.forEach(file => {
        const filePath = path.resolve(file);
        grunt.file.write(filePath, originalContents[file]);
        console.log(`Restored ${file}`);
      });
    }

    initializeEmptyState();
    const intervalId = setInterval(updateFiles, testInterval);

    setTimeout(() => {
      clearInterval(intervalId);
      restoreFiles();
      console.log('Test update completed');
      done();
    }, testDuration);

    updateFiles(); // Initial update
  });
};