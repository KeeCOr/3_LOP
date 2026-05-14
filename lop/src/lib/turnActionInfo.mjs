export function getTurnActionInfo(state, isAnimating = false) {
  if (isAnimating) {
    return {
      step: '진행 중',
      title: '말 이동 중',
      description: '이동이 끝나면 다음 선택지가 열립니다.',
      tone: 'waiting',
    };
  }

  const phase = state.turnPhase;
  const table = {
    start_deploy: {
      step: '준비',
      title: '시작 병력 배치',
      description: '첫 영토 방어를 위해 시작 병력을 배치하세요.',
      tone: 'ready',
    },
    roll: {
      step: '1단계',
      title: '주사위 굴리기',
      description: '이동 거리를 정합니다. 더블이면 보너스 턴을 얻습니다.',
      tone: 'ready',
    },
    select_piece: {
      step: '2단계',
      title: '이동할 말 선택',
      description: '병력이 남아 있는 말 중 하나를 선택하세요.',
      tone: 'ready',
    },
    choose_move_tile: {
      step: '선택',
      title: '목적지 선택',
      description: '이동 카드 효과로 도착할 타일을 고르세요.',
      tone: 'ready',
    },
    choose_stop: {
      step: '선택',
      title: '경유지 정차',
      description: '지나친 내 영토에 들러 병력을 회수할 수 있습니다.',
      tone: 'ready',
    },
    tile_event: {
      step: '3단계',
      title: '타일 행동',
      description: '도착한 타일에서 점령, 통행료, 구매 중 필요한 행동을 처리하세요.',
      tone: 'ready',
    },
    battle: {
      step: '전투',
      title: '전투 해결',
      description: '공격과 방어 결과를 확인하고 다음 선택을 준비하세요.',
      tone: 'danger',
    },
    deploy: {
      step: '배치',
      title: '병력 배치',
      description: '말과 영토 사이에서 필요한 병력을 옮기세요.',
      tone: 'ready',
    },
    build: {
      step: '건설',
      title: '건물 관리',
      description: '소유 영토에 건물을 짓거나 업그레이드해 수익과 방어를 키우세요.',
      tone: 'ready',
    },
    shop: {
      step: '상점',
      title: '상점 이용',
      description: '병력, 카드, 회복 등 필요한 자원을 구매하세요.',
      tone: 'ready',
    },
    mercenary: {
      step: '용병',
      title: '용병 계약',
      description: '골드를 지불해 특수 병력을 고용할 수 있습니다.',
      tone: 'ready',
    },
    event_card: {
      step: '카드',
      title: '이벤트 카드',
      description: '카드 효과를 확인하고 적용하세요.',
      tone: 'ready',
    },
    forced_sell: {
      step: '위기',
      title: '통행료 정산',
      description: '골드가 부족하면 영토를 매각해서 통행료를 마련해야 합니다.',
      tone: 'danger',
    },
    end_turn: {
      step: '대기',
      title: '턴 정리',
      description: '현재 턴을 정리하고 다음 플레이어로 넘어갑니다.',
      tone: 'waiting',
    },
  };

  return table[phase] ?? {
    step: '진행',
    title: '상태 확인',
    description: '현재 가능한 행동을 확인하세요.',
    tone: 'waiting',
  };
}
