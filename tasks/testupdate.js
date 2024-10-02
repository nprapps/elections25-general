const path = require('path');

module.exports = function(grunt) {
  grunt.registerTask('testupdate', 'Test file updates for watching with realistic election data', function() {
    const done = this.async();
    const testInterval = 5000; 
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
      if (currentData['build/data/bop.json']) {
        currentData['build/data/bop.json'].house.forEach(race => {
          race.winner = "No";
        });
        currentData['build/data/bop.json'].senate.forEach(race => {
          race.winner = "No";
        });
      }
      // Initialize House and Senate data
      ['build/data/house.json', 'build/data/senate.json'].forEach(file => {
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
      const reportingPercentage = Math.min(updateCount * 0.1, 1); // 10% increase per update

      // Update BOP file every time
      updateBOPFile(reportingPercentage);
      const bopFilePath = path.resolve('build/data/bop.json');
      grunt.file.write(bopFilePath, JSON.stringify(currentData['build/data/bop.json'], null, 2));
      console.log(`Updated build/data/bop.json`);

      // Stagger updates for house and senate files
      if (updateCount % 2 === 1) {
        updateResultsFile('build/data/house.json', reportingPercentage);
        const houseFilePath = path.resolve('build/data/house.json');
        grunt.file.write(houseFilePath, JSON.stringify(currentData['build/data/house.json'], null, 2));
        console.log(`Updated build/data/house.json`);
      } else {
        updateResultsFile('build/data/senate.json', reportingPercentage);
        const senateFilePath = path.resolve('build/data/senate.json');
        grunt.file.write(senateFilePath, JSON.stringify(currentData['build/data/senate.json'], null, 2));
        console.log(`Updated build/data/senate.json`);
      }
    }

    function updateBOPFile(reportingPercentage) {
      if (currentData['build/data/bop.json']) {
        currentData['build/data/bop.json'].house.forEach(race => {
          if (Math.random() < reportingPercentage && race.winner === "No") {
            race.winner = Math.random() < 0.5 ? "Dem" : "GOP";
          }
        });
        currentData['build/data/bop.json'].senate.forEach(race => {
          if (Math.random() < reportingPercentage && race.winner === "No") {
            race.winner = Math.random() < 0.5 ? "Dem" : "GOP";
          }
        });
      }
    }

    function updateResultsFile(file, reportingPercentage) {
      if (currentData[file] && currentData[file].results) {
        currentData[file].results.forEach(race => {
          if (!race.called && Math.random() < reportingPercentage) {
            // If the race wasn't called before, decide if it's called now
            race.called = Math.random() < 0.3; 
            
            // Distribute new votes
            const newVotes = Math.floor(Math.random() * 10000) + 1000;
            let remainingVotes = newVotes;
            
            race.candidates.forEach((candidate, index) => {
              if (index === race.candidates.length - 1) {
                candidate.votes += remainingVotes;
              } else {
                const candidateNewVotes = Math.floor(Math.random() * remainingVotes);
                candidate.votes += candidateNewVotes;
                remainingVotes -= candidateNewVotes;
              }
            });
            
            // Recalculate percentages
            const totalVotes = race.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
            race.candidates.forEach(candidate => {
              candidate.percent = candidate.votes / totalVotes;
            });

            // Determine winner if race is called
            if (race.called) {
              const winner = race.candidates.reduce((prev, current) => 
                (prev.votes > current.votes) ? prev : current
              );
              winner.winner = true;
              race.winnerParty = winner.party;
            }
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