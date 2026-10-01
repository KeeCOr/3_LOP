export function getEventResultInfo(effect = {}) {
  const map = {
    gold: ['자원', `골드 +${effect.amount}`, '병력·건물·통행 대비 중 어디에 쓸지 정하세요.'],
    troops: ['세력', `현재 말 병력 +${effect.amount}명`, '공격에 쓸지 수입 영토를 지킬지 정하세요.'],
    troop_boost: ['세력', effect.costPerTroop === 0 ? `무료 병력 최대 +${effect.maxAmount}명` : `병력 최대 +${effect.maxAmount}명 구매`, '병력 이득과 골드 소모를 비교하세요.'],
    dice_bonus: ['이동', `다음 주사위 +${effect.amount}`, '보너스를 가장 가치 있는 칸에 연결할 말을 고르세요.'],
    attack_boost: ['세력', `다음 공격 ×${effect.multiplier}`, '효과가 사라지기 전에 가치 높은 적 영토를 살펴보세요.'],
    defense_boost: ['세력', `다음 방어 ×${effect.multiplier}`, '위험한 경계를 지킬지 반격을 유도할지 정하세요.'],
    toll_exempt: ['자원', '다음 통행세 면제', '적 영토를 지나며 아낀 골드를 다음 행동에 배분하세요.'],
    toll_double: ['자원', `${effect.laps}바퀴 동안 통행세 2배`, '상대가 지나갈 가능성이 높은 영토를 확인하세요.'],
    build_discount: ['자원', `${effect.laps}바퀴 동안 다음 건물 50% 할인`, '수입 또는 방어 변화가 큰 영토를 비교하세요.'],
    garrison_reinforce: ['지도', `보유 영토 무작위 수비 +${effect.amount}명`, '강화된 전선을 확인하고 확장 경로를 정하세요.'],
    free_build: ['지도', '다음 건물 1채 무료', '수입 또는 방어가 가장 크게 바뀌는 영토를 고르세요.'],
    dragon_summon: ['지도', '5바퀴 뒤 최고가 영토에 드래곤 출현', '위협이 생길 영토와 우회 경로를 미리 확인하세요.'],
    move_to_tile: ['이동', '원하는 칸 이동 선택 해금', '다음 사건과 전투 위치를 비교해 목적지를 고르세요.'],
    move_to_shop: ['이동', '군수 상점으로 이동', '현재 가장 부족한 자원을 보충하세요.'],
    reset_land: ['지도', '무작위 적 영토 초기화', '소유권과 빈 영토를 다시 확인하세요.'],
    tax_exempt: ['자원', '현재 세금 부담 제거', '남은 골드를 성장과 병력 중 어디에 쓸지 정하세요.'],
    defense_reinforce: ['세력', `방어 병력 +${effect.amount}명`, '버틸지 반격할지 다음 전투 계획을 정하세요.'],
  };
  const [area, change, next] = map[effect.kind] || ['상태', '보드 상태 변경', '지도·세력·자원을 다시 확인하세요.'];
  return { area, change, next };
}
