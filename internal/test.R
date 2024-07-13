
source("../stanpump.R");

#stanpump('{"action": "simulate", "weight": 70, "height": 170, "age": 50, "sex": "male", "maximum": 60, "drug": [ "remifentanil", "remifentanil", "remifentanil","propofol","propofol","propofol"], "time": [0, 0, 40, 0, 0, 30],"dose":[60, 0.15, 0, 200, 150, 0],"units":["mcg", "mcg/kg/min", "mcg/kg/min", "mg", "mcg/kg/min", "mcg/kg/min"]}');

#stanpump('{"action": "simulate", "filename": "DexMedExample0.2", "weight": 3.8, "height": 52, "age": 0.0415, "sex": "female", "maximum": 420, "drug": [ "dexmedetomidine","dexmedetomidine","dexmedetomidine","dexmedetomidine","dexmedetomidine","dexmedetomidine","dexmedetomidine"], "time": [0,0,60,120,180,240,360 ], "dose": [ 0.24,0.22,1.28,0.04,0,0.14,0 ], "units": ["mcg/kg","mcg/kg/hr","mcg","mcg/kg/hr","mcg/kg/hr","mcg/kg/hr","mcg/kg/hr" ], "eventtimes": [0,60,180,360], "eventnames": ["Start","CPB Start","CPB End","End"], "eventfills": ["Start","CPB Start","CPB End","End"], "annotations": [] }')

#stanpump('{ "action": "simulate", "filename": "DexMedExample0.2", "weight": 3.8, "height": 52, "age": 0.0415, "sex": "female", "maximum": 420, "drug": [ "dexmedetomidine","dexmedetomidine","dexmedetomidine","dexmedetomidine","dexmedetomidine","dexmedetomidine","dexmedetomidine"], "time": [0,0,60,120,180,240,360 ], "dose": [ 0.24,0.22,1.28,0.04,0,0.14,0 ], "units": ["mcg/kg","mcg/kg/hr","mcg","mcg/kg/hr","mcg/kg/hr","mcg/kg/hr","mcg/kg/hr" ], "eventtimes": [], "eventnames": [], "eventfills": [], "annotations": [] }')

stanpump('{ "action": "suggest", "weight": 70, "height": 170, "age": 50, "sex": "male", "suggestDrug": "remifentanil", "suggestTime": [1], "suggestTarget": [4], "suggestEndTime": 60}')

