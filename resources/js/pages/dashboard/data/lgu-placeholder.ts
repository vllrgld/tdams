export type LguStats = {
    lots: number;
    documents: number;
};

/**
 * Illustrative archive figures per LGU, keyed by PSGC code. Not connected to
 * live archive records.
 */
export const lguStats: Record<string, LguStats> = {
    PH012812000: { lots: 462, documents: 1184 }, // Laoag City
    PH012805000: { lots: 328, documents: 842 }, // Batac City
    PH012820000: { lots: 244, documents: 615 }, // San Nicolas
    PH012816000: { lots: 196, documents: 503 }, // Paoay
    PH012802000: { lots: 158, documents: 398 }, // Bacarra
    PH012823000: { lots: 142, documents: 351 }, // Vintar
    PH012809000: { lots: 131, documents: 327 }, // Dingras
    PH012815000: { lots: 118, documents: 284 }, // Pagudpud
    PH012819000: { lots: 104, documents: 262 }, // Pinili
    PH012803000: { lots: 97, documents: 241 }, // Badoc
    PH012817000: { lots: 92, documents: 226 }, // Pasuquin
    PH012821000: { lots: 86, documents: 208 }, // Sarrat
    PH012808000: { lots: 79, documents: 193 }, // Currimao
    PH012818000: { lots: 71, documents: 172 }, // Piddig
    PH012822000: { lots: 63, documents: 151 }, // Solsona
    PH012813000: { lots: 58, documents: 139 }, // Marcos
    PH012811000: { lots: 54, documents: 128 }, // Banna (Espiritu)
    PH012804000: { lots: 47, documents: 112 }, // Bangui
    PH012806000: { lots: 38, documents: 91 }, // Burgos
    PH012814000: { lots: 31, documents: 74 }, // Nueva Era
    PH012807000: { lots: 22, documents: 53 }, // Carasi
    PH012810000: { lots: 17, documents: 41 }, // Dumalneg
    PH012801000: { lots: 12, documents: 29 }, // Adams
};
