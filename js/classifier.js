
/*
  run with:
  portsmouthClassifier.classify(marks);
*/

var portsmouthClassifier = (function() {

	var totalCredits = function(year) {
		return _.reduce(year, function(memo, unit) {
			return memo + parseInt(unit.credits, 10);
		}, 0);
	};

	var sortByGrade = function(year) {
		return _.sortBy(year, function(unit) { return -unit.grade; });
	};

	var cloneYearMarks = function(year) {
		var clone = year.slice(0);
		return _.map(clone, function(unit) { return _.clone(unit); });
	};

	var sumGrades = function(year) {
		return _.reduce(year, function(memo, unit) {
			return memo + parseInt(unit.grade, 10);
		}, 0);
	};

	var grader = function(mark) {
		var grade;

		if (mark <= 39) {
			grade = 'Fail';
		}
		else if (mark >= 40 && mark <= 49) {
			grade = '3rd';
		}
		else if (mark >= 50 && mark <= 59) {
			grade = '2:2';
		}
		else if (mark >= 60 && mark <= 69) {
			grade = '2:1';
		}
		else if (mark >= 70) {
			grade = '1st';
		}

		return grade;
	};

	var standardiseUnits = function(marks) {
		// turn all units into 10-credit equivalents
		var year = cloneYearMarks(marks);
		var newMarks = [];

		_.each(year, function(y) {
			y.grade = parseInt(y.grade, 10);

			if (y.credits == 10) {
				newMarks.push(y);
			}
			else if (y.credits == 20) {
				y.credits = 10;
				newMarks.push(y);
				newMarks.push(y);
			}
			else if (y.credits == 40) {
				y.credits = 10;
				newMarks.push(y);
				newMarks.push(y);
				newMarks.push(y);
				newMarks.push(y);
			}
			else {
				throw new Error('Unknown number of credits: '+y.credits);
			}
		});


		return sortByGrade(newMarks).slice(0, -2);
	};

	var removeWorst20Credits = function(marks) {
		return marks.slice(0, -2);
	};

	var classifiers = {
		ruleA: function(grades) {
			var y2 = removeWorst20Credits(standardiseUnits(grades.year2));
			var y3 = removeWorst20Credits(standardiseUnits(grades.year3));

			var meanY2 = sumGrades(y2) / y2.length;
			var meanY3 = sumGrades(y3) / y3.length;

			return Math.round((meanY2 / 100 * 40) + (meanY3 / 100 * 60));
		},

		ruleB: function(grades) {
			var y3 = removeWorst20Credits(standardiseUnits(grades.year3));
			return Math.round(sumGrades(y3) / y3.length);
		},

		ruleC: function(grades) {
			var y2 = removeWorst20Credits(standardiseUnits(grades.year2));
			var y3 = removeWorst20Credits(standardiseUnits(grades.year3));

			// combine them & sort them
			var join = sortByGrade(y2.concat(y3));

			// grab 100 credits (top 50%) worth of units
			var creditCount = 0,
				i = 0,
				top100 = [],
				tempUnit;

			while (creditCount < 100) {
				tempUnit = join[i];
				creditCount += parseInt(tempUnit.credits, 10);
				top100.push(tempUnit);
				i++;
			}

			// take bottom grade
			return Math.round(_.last(top100).grade);
		}
	};

	return {
		totalCredits: totalCredits,
		classify: function(marks) {
			var results = [
				classifiers.ruleA(marks),
				classifiers.ruleB(marks),
				classifiers.ruleC(marks)
			];

			var result = _.first(_.sortBy(results, function(r) { return -r; }));

			var grade = grader(result);

			return {
				grade: grade,
				result: result+'%',
				details: {
					ruleA: results[0]+'%',
					ruleB: results[1]+'%',
					ruleC: results[2]+'%'
				}
			};
		}
	};

})();

