// Exact V69P12R1 WORK_TEST source, independently verified from Drive ZIP
// 1Jh-ssNwDO_k6byI8M0jrE7GiOgBNktMM. Classification only, no floor override.
// Unchanged V69 parts are inherited. The replacement kitchen rig has its own
// SHA/scene/node/mesh/name/parent allowlist derived from the same source bytes.
import { V69_BUILDING_PARTS, V69_BUILDING_SCENES } from './privateModelC80R2V69LayerSourceProfile.mjs';
import { sameSourceName } from './privateModelSourceNodeAssociations.mjs';
export const V69P12R1_SOURCE_SHA256 = 'd39102890470f59d7c2a2e033851a6f3d1481a83fb6180b549acd4cbf22182b3';
export const V69P12R1_SOURCE_SCENE_COUNT = 295;
export const V69P12R1_FLOORS = Object.freeze({ '1F': 290, '2F': 293, BOTH: 294 });
// Exact mesh leaves read from source roots 9914 (2F293) and 9985 (BOTH294).
// Groups are never layer roots. Source links and WORK_TEST/HOST_HOLD stay intact.
export const V69P12R1_RIG_PARTS = Object.freeze({
  9916: Object.freeze({"id":"architecture-fixtures","mesh":3592,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_DISHWASHER_LEFT_595_ORDER_ASSUMPTION_BODY_V57_SAME_WHITE"}),
  9918: Object.freeze({"id":"architecture-fixtures","mesh":3593,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_SOKKEL_100MM"}),
  9920: Object.freeze({"id":"architecture-fixtures","mesh":3594,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_FRONT_LOWER_300"}),
  9922: Object.freeze({"id":"architecture-fixtures","mesh":3595,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_FRONT_MIDDLE_300"}),
  9924: Object.freeze({"id":"architecture-fixtures","mesh":3596,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_FRONT_UPPER_140"}),
  9925: Object.freeze({"id":"architecture-fixtures","mesh":3597,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_LOWER_GROOVE_20_EST"}),
  9926: Object.freeze({"id":"architecture-fixtures","mesh":3598,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_COMMON_GROOVE_20_EST"}),
  9928: Object.freeze({"id":"architecture-fixtures","mesh":3599,"name":"C80R2_V69_P12_OPTIN__V59P2_SINK_CABINET_BODY_INTERIOR_OPEN_LID_HIDDEN_COW_S264"}),
  9930: Object.freeze({"id":"architecture-fixtures","mesh":3600,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_SOKKEL_100MM"}),
  9932: Object.freeze({"id":"architecture-fixtures","mesh":3601,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_FRONT_LOWER_300"}),
  9934: Object.freeze({"id":"architecture-fixtures","mesh":3602,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_FRONT_MIDDLE_300"}),
  9936: Object.freeze({"id":"architecture-fixtures","mesh":3603,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_FRONT_UPPER_140"}),
  9937: Object.freeze({"id":"architecture-fixtures","mesh":3604,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_LOWER_GROOVE_20_EST"}),
  9938: Object.freeze({"id":"architecture-fixtures","mesh":3605,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_COMMON_GROOVE_20_EST"}),
  9940: Object.freeze({"id":"architecture-fixtures","mesh":3606,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_WIDE_RIGHT_795_ORDER_ASSUMPTION_BODY_V57_SAME_WHITE"}),
  9942: Object.freeze({"id":"architecture-fixtures","mesh":3607,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_SOKKEL_100MM"}),
  9944: Object.freeze({"id":"architecture-fixtures","mesh":3608,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_FRONT_LOWER_300"}),
  9946: Object.freeze({"id":"architecture-fixtures","mesh":3609,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_FRONT_MIDDLE_300"}),
  9948: Object.freeze({"id":"architecture-fixtures","mesh":3610,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_FRONT_UPPER_140"}),
  9949: Object.freeze({"id":"architecture-fixtures","mesh":3611,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_LOWER_GROOVE_20_EST"}),
  9950: Object.freeze({"id":"architecture-fixtures","mesh":3612,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_COMMON_GROOVE_20_EST"}),
  9951: Object.freeze({"id":"architecture-fixtures","mesh":3613,"name":"C80R2_V69_P12_OPTIN__V59P8_DARK_COUNTER_R12_FROM_NODE_9909"}),
  9953: Object.freeze({"id":"architecture-fixtures","mesh":3614,"name":"C80R2_V69_P12_OPTIN__V59P8_WHITE_BASIN_OWNER5MM_FROM_NODE_9910"}),
  9954: Object.freeze({"id":"architecture-fixtures","mesh":3615,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_01_S262"}),
  9955: Object.freeze({"id":"architecture-fixtures","mesh":3616,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_02_S262"}),
  9956: Object.freeze({"id":"architecture-fixtures","mesh":3617,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_03_S262"}),
  9957: Object.freeze({"id":"architecture-fixtures","mesh":3618,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_04_S262"}),
  9958: Object.freeze({"id":"architecture-fixtures","mesh":3619,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_05_S262"}),
  9959: Object.freeze({"id":"architecture-fixtures","mesh":3620,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_06_S262"}),
  9960: Object.freeze({"id":"architecture-fixtures","mesh":3621,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_07_S262"}),
  9961: Object.freeze({"id":"architecture-fixtures","mesh":3622,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_08_S262"}),
  9962: Object.freeze({"id":"architecture-fixtures","mesh":3623,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_09_S262"}),
  9963: Object.freeze({"id":"architecture-fixtures","mesh":3624,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_10_S262"}),
  9964: Object.freeze({"id":"architecture-fixtures","mesh":3625,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_11_S262"}),
  9965: Object.freeze({"id":"architecture-fixtures","mesh":3626,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_12_S262"}),
  9966: Object.freeze({"id":"architecture-fixtures","mesh":3627,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_13_S262"}),
  9967: Object.freeze({"id":"architecture-fixtures","mesh":3628,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_14_S262"}),
  9968: Object.freeze({"id":"architecture-fixtures","mesh":3629,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_15_S262"}),
  9969: Object.freeze({"id":"architecture-fixtures","mesh":3630,"name":"C80R2_V69_P12_OPTIN__V59P2_VISIBLE_V59P1_PHOTO_OVERFLOW_DARK_S262"}),
  9970: Object.freeze({"id":"architecture-fixtures","mesh":3631,"name":"C80R2_V69_P12_OPTIN__V59P2_VISIBLE_V59P1_PHOTO_OVERFLOW_RIM_S262"}),
  9972: Object.freeze({"id":"architecture-fixtures","mesh":3632,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_01_MAIN_MIXER_BODY_SHORT_Ø50_2VIEW_D2F"}),
  9973: Object.freeze({"id":"architecture-fixtures","mesh":3633,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_02_UPPER_SWIVEL_COLLAR_D2F"}),
  9974: Object.freeze({"id":"architecture-fixtures","mesh":3634,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_03_LOWER_CHROME_FOOT_SEAL_D2F"}),
  9975: Object.freeze({"id":"architecture-fixtures","mesh":3635,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_04_CONTINUOUS_Ø28_GOOSENECK_353_272_178_D2F"}),
  9976: Object.freeze({"id":"architecture-fixtures","mesh":3636,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_05_INTEGRATED_OBLIQUE_OUTLET_LIP_D2F"}),
  9977: Object.freeze({"id":"architecture-fixtures","mesh":3637,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_06_RECESSED_DARK_AERATOR_D2F"}),
  9978: Object.freeze({"id":"architecture-fixtures","mesh":3638,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_07_RIGHT_MIXER_STEPPED_SIDE_BODY_D2F"}),
  9979: Object.freeze({"id":"architecture-fixtures","mesh":3639,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_08_RIGHT_MIXER_ENDCAP_D2F"}),
  9980: Object.freeze({"id":"architecture-fixtures","mesh":3640,"name":"C80R2_V69_P12_OPTIN__V59P12_HG14875000_RIGHT_MIXER_LEVER_CYLINDRICAL_ROUND_PHOTO_D2F"}),
  9981: Object.freeze({"id":"architecture-fixtures","mesh":3641,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_10_MIXER_LEVER_HINGE_D2F"}),
  9982: Object.freeze({"id":"architecture-fixtures","mesh":3642,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_11_LEFT_APK_STOP_VALVE_BODY_D2F"}),
  9983: Object.freeze({"id":"architecture-fixtures","mesh":3643,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_12_LEFT_APK_STOP_VALVE_ENDCAP_D2F"}),
  9984: Object.freeze({"id":"architecture-fixtures","mesh":3644,"name":"C80R2_V69_P12_OPTIN__V59P12_HG14875000_LEFT_APK_PEG_CYLINDRICAL_ROUND_PHOTO_D2F"}),
  9987: Object.freeze({"id":"architecture-fixtures","mesh":3645,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_DISHWASHER_LEFT_595_ORDER_ASSUMPTION_BODY_V57_SAME_WHITE"}),
  9989: Object.freeze({"id":"architecture-fixtures","mesh":3646,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_SOKKEL_100MM"}),
  9991: Object.freeze({"id":"architecture-fixtures","mesh":3647,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_FRONT_LOWER_300"}),
  9993: Object.freeze({"id":"architecture-fixtures","mesh":3648,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_FRONT_MIDDLE_300"}),
  9995: Object.freeze({"id":"architecture-fixtures","mesh":3649,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_FRONT_UPPER_140"}),
  9996: Object.freeze({"id":"architecture-fixtures","mesh":3597,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_LOWER_GROOVE_20_EST"}),
  9997: Object.freeze({"id":"architecture-fixtures","mesh":3598,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY1_COMMON_GROOVE_20_EST"}),
  9999: Object.freeze({"id":"architecture-fixtures","mesh":3650,"name":"C80R2_V69_P12_OPTIN__V59P2_SINK_CABINET_BODY_INTERIOR_OPEN_LID_HIDDEN_COW_S265"}),
  10001: Object.freeze({"id":"architecture-fixtures","mesh":3651,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_SOKKEL_100MM"}),
  10003: Object.freeze({"id":"architecture-fixtures","mesh":3652,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_FRONT_LOWER_300"}),
  10005: Object.freeze({"id":"architecture-fixtures","mesh":3653,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_FRONT_MIDDLE_300"}),
  10007: Object.freeze({"id":"architecture-fixtures","mesh":3654,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_FRONT_UPPER_140"}),
  10008: Object.freeze({"id":"architecture-fixtures","mesh":3604,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_LOWER_GROOVE_20_EST"}),
  10009: Object.freeze({"id":"architecture-fixtures","mesh":3605,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY2_COMMON_GROOVE_20_EST"}),
  10011: Object.freeze({"id":"architecture-fixtures","mesh":3655,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_WIDE_RIGHT_795_ORDER_ASSUMPTION_BODY_V57_SAME_WHITE"}),
  10013: Object.freeze({"id":"architecture-fixtures","mesh":3656,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_SOKKEL_100MM"}),
  10015: Object.freeze({"id":"architecture-fixtures","mesh":3657,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_FRONT_LOWER_300"}),
  10017: Object.freeze({"id":"architecture-fixtures","mesh":3658,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_FRONT_MIDDLE_300"}),
  10019: Object.freeze({"id":"architecture-fixtures","mesh":3659,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_FRONT_UPPER_140"}),
  10020: Object.freeze({"id":"architecture-fixtures","mesh":3611,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_LOWER_GROOVE_20_EST"}),
  10021: Object.freeze({"id":"architecture-fixtures","mesh":3612,"name":"C80R2_V69_P12_OPTIN__LOW3_BAY3_COMMON_GROOVE_20_EST"}),
  10022: Object.freeze({"id":"architecture-fixtures","mesh":3613,"name":"C80R2_V69_P12_OPTIN__V59P8_DARK_COUNTER_R12_FROM_NODE_9913"}),
  10024: Object.freeze({"id":"architecture-fixtures","mesh":3614,"name":"C80R2_V69_P12_OPTIN__V59P8_WHITE_BASIN_OWNER5MM_FROM_NODE_9914"}),
  10025: Object.freeze({"id":"architecture-fixtures","mesh":3615,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_01_S263"}),
  10026: Object.freeze({"id":"architecture-fixtures","mesh":3616,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_02_S263"}),
  10027: Object.freeze({"id":"architecture-fixtures","mesh":3617,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_03_S263"}),
  10028: Object.freeze({"id":"architecture-fixtures","mesh":3618,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_04_S263"}),
  10029: Object.freeze({"id":"architecture-fixtures","mesh":3619,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_05_S263"}),
  10030: Object.freeze({"id":"architecture-fixtures","mesh":3620,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_06_S263"}),
  10031: Object.freeze({"id":"architecture-fixtures","mesh":3621,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_07_S263"}),
  10032: Object.freeze({"id":"architecture-fixtures","mesh":3622,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_08_S263"}),
  10033: Object.freeze({"id":"architecture-fixtures","mesh":3623,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_09_S263"}),
  10034: Object.freeze({"id":"architecture-fixtures","mesh":3624,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_10_S263"}),
  10035: Object.freeze({"id":"architecture-fixtures","mesh":3625,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_11_S263"}),
  10036: Object.freeze({"id":"architecture-fixtures","mesh":3626,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_12_S263"}),
  10037: Object.freeze({"id":"architecture-fixtures","mesh":3627,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_13_S263"}),
  10038: Object.freeze({"id":"architecture-fixtures","mesh":3628,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_14_S263"}),
  10039: Object.freeze({"id":"architecture-fixtures","mesh":3629,"name":"C80R2_V69_P12_OPTIN__V59P2_METAL_V59P1_KVIK_16_PRODUCT_MESH_SOURCE_15_S263"}),
  10040: Object.freeze({"id":"architecture-fixtures","mesh":3630,"name":"C80R2_V69_P12_OPTIN__V59P2_VISIBLE_V59P1_PHOTO_OVERFLOW_DARK_S263"}),
  10041: Object.freeze({"id":"architecture-fixtures","mesh":3631,"name":"C80R2_V69_P12_OPTIN__V59P2_VISIBLE_V59P1_PHOTO_OVERFLOW_RIM_S263"}),
  10043: Object.freeze({"id":"architecture-fixtures","mesh":3632,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_01_MAIN_MIXER_BODY_SHORT_Ø50_2VIEW_BOTH"}),
  10044: Object.freeze({"id":"architecture-fixtures","mesh":3633,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_02_UPPER_SWIVEL_COLLAR_BOTH"}),
  10045: Object.freeze({"id":"architecture-fixtures","mesh":3634,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_03_LOWER_CHROME_FOOT_SEAL_BOTH"}),
  10046: Object.freeze({"id":"architecture-fixtures","mesh":3635,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_04_CONTINUOUS_Ø28_GOOSENECK_353_272_178_BOTH"}),
  10047: Object.freeze({"id":"architecture-fixtures","mesh":3636,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_05_INTEGRATED_OBLIQUE_OUTLET_LIP_BOTH"}),
  10048: Object.freeze({"id":"architecture-fixtures","mesh":3637,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_06_RECESSED_DARK_AERATOR_BOTH"}),
  10049: Object.freeze({"id":"architecture-fixtures","mesh":3638,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_07_RIGHT_MIXER_STEPPED_SIDE_BODY_BOTH"}),
  10050: Object.freeze({"id":"architecture-fixtures","mesh":3639,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_08_RIGHT_MIXER_ENDCAP_BOTH"}),
  10051: Object.freeze({"id":"architecture-fixtures","mesh":3640,"name":"C80R2_V69_P12_OPTIN__V59P12_HG14875000_RIGHT_MIXER_LEVER_CYLINDRICAL_ROUND_PHOTO_BOTH"}),
  10052: Object.freeze({"id":"architecture-fixtures","mesh":3641,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_10_MIXER_LEVER_HINGE_BOTH"}),
  10053: Object.freeze({"id":"architecture-fixtures","mesh":3642,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_11_LEFT_APK_STOP_VALVE_BODY_BOTH"}),
  10054: Object.freeze({"id":"architecture-fixtures","mesh":3643,"name":"C80R2_V69_P12_OPTIN__V59P11_HG14875000_12_LEFT_APK_STOP_VALVE_ENDCAP_BOTH"}),
  10055: Object.freeze({"id":"architecture-fixtures","mesh":3644,"name":"C80R2_V69_P12_OPTIN__V59P12_HG14875000_LEFT_APK_PEG_CYLINDRICAL_ROUND_PHOTO_BOTH"}),
});
const rigPaths = Object.freeze({
  293: Object.freeze({"9916":[[9914,9915,9916]],"9918":[[9914,9915,9917,9918]],"9920":[[9914,9915,9919,9920]],"9922":[[9914,9915,9921,9922]],"9924":[[9914,9915,9923,9924]],"9925":[[9914,9915,9925]],"9926":[[9914,9915,9926]],"9928":[[9914,9927,9928]],"9930":[[9914,9927,9929,9930]],"9932":[[9914,9927,9931,9932]],"9934":[[9914,9927,9933,9934]],"9936":[[9914,9927,9935,9936]],"9937":[[9914,9927,9937]],"9938":[[9914,9927,9938]],"9940":[[9914,9939,9940]],"9942":[[9914,9939,9941,9942]],"9944":[[9914,9939,9943,9944]],"9946":[[9914,9939,9945,9946]],"9948":[[9914,9939,9947,9948]],"9949":[[9914,9939,9949]],"9950":[[9914,9939,9950]],"9951":[[9914,9951]],"9953":[[9914,9952,9953]],"9954":[[9914,9952,9954]],"9955":[[9914,9952,9955]],"9956":[[9914,9952,9956]],"9957":[[9914,9952,9957]],"9958":[[9914,9952,9958]],"9959":[[9914,9952,9959]],"9960":[[9914,9952,9960]],"9961":[[9914,9952,9961]],"9962":[[9914,9952,9962]],"9963":[[9914,9952,9963]],"9964":[[9914,9952,9964]],"9965":[[9914,9952,9965]],"9966":[[9914,9952,9966]],"9967":[[9914,9952,9967]],"9968":[[9914,9952,9968]],"9969":[[9914,9952,9969]],"9970":[[9914,9952,9970]],"9972":[[9914,9952,9971,9972]],"9973":[[9914,9952,9971,9973]],"9974":[[9914,9952,9971,9974]],"9975":[[9914,9952,9971,9975]],"9976":[[9914,9952,9971,9976]],"9977":[[9914,9952,9971,9977]],"9978":[[9914,9952,9971,9978]],"9979":[[9914,9952,9971,9979]],"9980":[[9914,9952,9971,9980]],"9981":[[9914,9952,9971,9981]],"9982":[[9914,9952,9971,9982]],"9983":[[9914,9952,9971,9983]],"9984":[[9914,9952,9971,9984]]}),
  294: Object.freeze({"9987":[[9985,9986,9987]],"9989":[[9985,9986,9988,9989]],"9991":[[9985,9986,9990,9991]],"9993":[[9985,9986,9992,9993]],"9995":[[9985,9986,9994,9995]],"9996":[[9985,9986,9996]],"9997":[[9985,9986,9997]],"9999":[[9985,9998,9999]],"10001":[[9985,9998,10000,10001]],"10003":[[9985,9998,10002,10003]],"10005":[[9985,9998,10004,10005]],"10007":[[9985,9998,10006,10007]],"10008":[[9985,9998,10008]],"10009":[[9985,9998,10009]],"10011":[[9985,10010,10011]],"10013":[[9985,10010,10012,10013]],"10015":[[9985,10010,10014,10015]],"10017":[[9985,10010,10016,10017]],"10019":[[9985,10010,10018,10019]],"10020":[[9985,10010,10020]],"10021":[[9985,10010,10021]],"10022":[[9985,10022]],"10024":[[9985,10023,10024]],"10025":[[9985,10023,10025]],"10026":[[9985,10023,10026]],"10027":[[9985,10023,10027]],"10028":[[9985,10023,10028]],"10029":[[9985,10023,10029]],"10030":[[9985,10023,10030]],"10031":[[9985,10023,10031]],"10032":[[9985,10023,10032]],"10033":[[9985,10023,10033]],"10034":[[9985,10023,10034]],"10035":[[9985,10023,10035]],"10036":[[9985,10023,10036]],"10037":[[9985,10023,10037]],"10038":[[9985,10023,10038]],"10039":[[9985,10023,10039]],"10040":[[9985,10023,10040]],"10041":[[9985,10023,10041]],"10043":[[9985,10023,10042,10043]],"10044":[[9985,10023,10042,10044]],"10045":[[9985,10023,10042,10045]],"10046":[[9985,10023,10042,10046]],"10047":[[9985,10023,10042,10047]],"10048":[[9985,10023,10042,10048]],"10049":[[9985,10023,10042,10049]],"10050":[[9985,10023,10042,10050]],"10051":[[9985,10023,10042,10051]],"10052":[[9985,10023,10042,10052]],"10053":[[9985,10023,10042,10053]],"10054":[[9985,10023,10042,10054]],"10055":[[9985,10023,10042,10055]]}),
});
// C80-023: exact, pre-existing 2F balcony-facing wall root. This classifies
// the unchanged WORK_TEST mesh for Layers only, without sourceLinks rebinding.
export const V69P12R1_BUILDING_PARTS = Object.freeze({
  ...V69_BUILDING_PARTS,
  ...V69P12R1_RIG_PARTS,
  6435: Object.freeze({
    id: 'architecture-walls-exterior',
    mesh: 1853,
    name: 'HI20_C80-023_2F_OPTIN_WORK_TEST_HOST_HOLD__C80_043_WHITE_SC41__IN_44SCENE_2F__REBASED_IN_WP6WP8G3_46SCENE_6435',
  }),
});
const sourceScenes = {"290":{"old":290,"name":"C80R2_V69_1F_V68_H3_FLOOR_DEDUP_H4_100MM_INTEGRATED_WORK_TEST_HOST_HOLD_20261104","rootNodes":[6430,9175,9280,8011,8746,8747,8748,8749,8750,8751,8752,8753,2220,7646,5224,6457,6377,7647,7648,7649,7650,7999,9281,5285,6955,6956,6957,6958,6959,6960,5733,6631,6632,7651,7652,7653,7654,9913,6365,6419,6420,6421,6497,7655,8756,8672,6524,7656,7657,7658,8673,6620,7659,7660,9841,6376,6652,6727,6728,6847,6848,9201,9202,9203,9204,9205,9206,9207,9208,9209,9210,9211,9212,9213,9214,9215,9216,6850,7221,8757,7594,8758,7597,9282,7993,7994,7995,7996,8007,9798,9261,9843,9800,9801,9802,9803,8760,8674,8675,8681,8684,8687,9262,8846,8690,9283,9250,8857,9286,8962,9003,9006,9008,9194,9231,9844,9287,9259,9274,9272,9276,9277,9365,9375,9382,9384,9385,9387,9391,9393,9394,9395,9396,9516]},"293":{"old":291,"name":"C80R2_V69_V59P12_SINK_FAUCET_OPTIN_2F_WORK_TEST_HOST_HOLD_20261104","rootNodes":[9259,2506,7356,2658,2661,6431,6432,6433,9842,7361,7366,7367,5323,7368,5327,5629,5880,7369,9303,5835,5836,5837,5838,9263,7370,6435,7371,8003,5887,5888,6472,6473,6474,6475,6476,6515,6517,6518,6519,6831,6832,6564,6565,6994,7372,6653,6729,6730,7222,8083,7748,7766,9573,9574,9575,9576,7904,7905,7906,7907,7908,7909,7932,9119,7959,7979,8024,8025,8026,9264,8199,8895,8913,9195,9196,9197,9198,9199,9200,9257,9805,9258,9332,9911,9912,9761,9338,9763,9764,9762,9765,9766,9767,9572,9438,9914]},"294":{"old":292,"name":"C80R2_V69_V59P12_SINK_FAUCET_OPTIN_BOTH_WORK_TEST_HOST_HOLD_20261104","rootNodes":[6430,9175,9280,8011,8746,8747,8748,8749,8750,8751,8752,8753,2220,7646,5224,6457,6377,7647,7648,7649,7650,7999,9281,5285,6955,6956,6957,6958,6959,6960,5733,6631,6632,7651,7652,7653,7654,9913,6365,6419,6420,6421,6497,7655,8756,8672,6524,7656,7657,7658,8673,6620,7659,7660,9841,6376,6652,6727,6728,6847,6848,9201,9202,9203,9204,9205,9206,9207,9208,9209,9210,9211,9212,9213,9214,9215,9216,6850,7221,8757,7594,8758,7597,9282,7993,7994,7995,7996,8007,9798,9261,9843,9800,9801,9802,9803,8760,8674,8675,8681,8684,8687,9262,8846,8690,9283,9250,8857,9286,8962,9003,9006,9008,9194,9231,9844,9287,9259,9274,9272,9276,9277,2506,7356,2658,2661,6431,6432,6433,9842,7361,7366,7367,5323,7368,5327,5629,5880,7369,9303,5835,5836,5837,5838,9263,7370,6435,7371,8003,5887,5888,6472,6473,6474,6475,6476,6515,6517,6518,6519,6831,6832,6564,6565,6994,7372,6653,6729,6730,7222,8083,7748,7766,9619,9620,9621,9622,7904,7905,7906,7907,7908,7909,7932,9119,7959,7979,8024,8025,8026,9264,8199,8895,8913,9195,9196,9197,9198,9199,9200,9257,9805,9258,9332,9911,9912,9761,9338,9763,9764,9762,9357,9359,9361,9363,9365,9765,9766,9767,9375,9382,9384,9385,9387,9391,9393,9394,9395,9396,9397,9398,9572,9438,9985,9516]}};
export const V69P12R1_BUILDING_SCENES = Object.freeze(Object.fromEntries(
  Object.entries(sourceScenes).map(([index, source]) => {
    const original = V69_BUILDING_SCENES[source.old];
    const roots = new Set(source.rootNodes);
    const paths = Object.fromEntries(Object.entries(original.paths)
      .map(([node, routes]) => [node, routes.filter(path => roots.has(path[0]))])
      .filter(([, routes]) => routes.length));
    // Source-scene 2F293 and BOTH294 include node 6435 directly at scene root.
    if ((index === '293' || index === '294') && roots.has(6435)) {
      paths['6435'] = [[6435]];
    }
    for (const [node, routes] of Object.entries(rigPaths[index] ?? {})) {
      if (routes.every(path => roots.has(path[0]))) paths[node] = routes;
    }
    return [index, Object.freeze({ ...original, name: source.name,
      rootNodes: Object.freeze(source.rootNodes), paths: Object.freeze(paths) })];
  }),
));

// Original architectural SOURCE_CONTEXT groups. Scene 293 explicitly
// authors an empty group; scene 294 contains three reference-only leaves.
// Terrain, stairs, physical walls and doors are independent scene roots.
const sourceContextProfiles = {
  293: { node: 5629, name: 'C80_SOURCE_CONTEXT_SEPARATE_FROM_FLOOR_CONTENT', parts: [] },
  294: { node: 7646, name: 'C80R2_C050_GUIDES_FACADE_COW_DC_WHITE_D1F_6499_V9COW',
    parts: [[5741, 1485], [6629, 1923], [7645, 1924]] },
};
const isContextReference = extras => extras?.sourceOnly === true &&
  extras.presentationOnly === true && extras.canApplyToViewer === false &&
  extras.physicalHost === 'HOST_HOLD' && extras.current === false && extras.asBuilt === false;

/** Resolve only authored reference content, using the same exact-source map as Layers. */
export function resolveV69P12R1SourceContext(gltf, scene, sceneIndex, loadedSha, expectedSha) {
  const profile = sourceContextProfiles[sceneIndex];
  const json = gltf?.parser?.json, sourceScene = json?.scenes?.[sceneIndex];
  const associations = gltf?.parser?.associations;
  const extra = json?.asset?.extras;
  if (!profile || loadedSha !== V69P12R1_SOURCE_SHA256 || expectedSha !== loadedSha ||
      json?.scenes?.length !== V69P12R1_SOURCE_SCENE_COUNT || gltf?.scenes?.[sceneIndex] !== scene ||
      extra?.current !== false || extra?.asBuilt !== false ||
      !Object.entries(V69P12R1_FLOORS).every(([floor, index]) => extra.viewerFloorScenes?.[floor] === index) ||
      sourceScene?.name !== sourceScenes[sceneIndex].name ||
      sourceScene.nodes?.filter(id => id === profile.node).length !== 1 ||
      typeof associations?.get !== 'function' || !Array.isArray(scene?.children)) return null;
  const definition = json.nodes?.[profile.node];
  if (definition?.name !== profile.name || definition.mesh !== undefined ||
      definition.extras?.contextOnly !== true || !isContextReference(definition.extras) ||
      (definition.children ?? []).length !== profile.parts.length ||
      (sceneIndex === 293 && definition.extras.HI12Meaning !==
        'EXPLICIT_EMPTY_2F_ARCHITECTURAL_SOURCE_CONTEXT;K17_ALWAYS_VISIBLE_OUTSIDE') ||
      (sceneIndex === 294 && definition.extras.visibility !== 'VISIBLE_BY_EXPLICIT_C80_SCENE_SELECTION')) return null;
  const matches = scene.children.filter(object => associations.get(object)?.nodes === profile.node);
  if (matches.length !== 1) return null;
  const root = matches[0];
  if (root.parent !== scene || root.isMesh || !sameSourceName(root.name, profile.name)) return null;
  // The loader can omit the shared 5741 plane from this scene's live group.
  // Validate its authored parent and report absence; never fetch or reparent it.
  // The two remaining reference leaves must match the same original path.
  const parts = [];
  let mountedIndex = 0;
  for (const [index, [node, mesh]] of profile.parts.entries()) {
    const def = json.nodes?.[node];
    if (definition.children[index] !== node || def?.mesh !== mesh || (def.children ?? []).length ||
        !isContextReference(def.extras)) return null;
    const object = root.children[mountedIndex];
    if (node === 5741 && !sameSourceName(object?.name, def.name)) {
      parts.push({ node, object: null });
      continue;
    }
    const association = associations.get(object);
    if (!object?.isMesh || object.children.length || object.parent !== root ||
        !sameSourceName(object.name, def.name) ||
        (association?.nodes !== undefined && association.nodes !== node) ||
        (association?.meshes !== undefined && association.meshes !== mesh)) return null;
    parts.push({ node, object });
    mountedIndex++;
  }
  if (mountedIndex !== root.children.length) return null;
  return { node: profile.node, root, parts };
}

